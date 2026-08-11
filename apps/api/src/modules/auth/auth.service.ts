import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  emailVerificationEmail,
  passwordResetEmail,
} from '../mail/mail.templates';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const PASSWORD_RESET_TTL_MINUTES = 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // If designer, create designer profile
    if (role === 'DESIGNER') {
      if (
        !registerDto.businessName ||
        !registerDto.shopAddress ||
        !registerDto.shopCity ||
        !registerDto.shopState
      ) {
        // Delete user if designer profile data is incomplete
        await this.prisma.user.delete({ where: { id: user.id } });
        throw new BadRequestException(
          'Designer registration requires businessName, shopAddress, shopCity, and shopState',
        );
      }

      // Generate slug from business name
      const slug = this.generateSlug(registerDto.businessName);

      await this.prisma.designerProfile.create({
        data: {
          userId: user.id,
          businessName: registerDto.businessName,
          slug,
          bio: registerDto.bio,
          shopAddress: registerDto.shopAddress,
          shopCity: registerDto.shopCity,
          shopState: registerDto.shopState,
        },
      });
    }

    // A failed verification email must not fail the registration itself; the
    // user can request a new link from their profile.
    try {
      await this.sendEmailVerification(user.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not send verification email to ${user.email}: ${reason}`,
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    // The response is identical whether or not the account exists, so the
    // endpoint cannot be used to enumerate registered emails.
    const genericResponse = {
      message: 'If the email exists, a reset link has been sent',
    };

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const { token, tokenHash } = this.createToken();

    // Only the newest link should work, so retire any outstanding ones.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
        ),
      },
    });

    const { subject, html } = passwordResetEmail({
      platformName: this.platformName,
      firstName: user.firstName,
      resetUrl: `${this.webUrl}/reset-password?token=${token}`,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });

    await this.mailService.send({ to: user.email, subject, html });

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset. You can now log in.' };
  }

  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    const { token, tokenHash } = this.createToken();

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
        ),
      },
    });

    const { subject, html } = emailVerificationEmail({
      platformName: this.platformName,
      firstName: user.firstName,
      verifyUrl: `${this.webUrl}/verify-email?token=${token}`,
      expiresInHours: EMAIL_VERIFICATION_TTL_HOURS,
    });

    await this.mailService.send({ to: user.email, subject, html });

    return { message: 'Verification email sent' };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification link is invalid or has expired',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  /**
   * Returns the raw token to email out and the hash to persist. Storing only
   * the hash means a database leak does not hand over usable reset links.
   */
  private createToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    return { token, tokenHash: this.hashToken(token) };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private get platformName(): string {
    return this.configService.get<string>('PLATFORM_NAME') ?? 'Steeze';
  }

  private get webUrl(): string {
    return (
      this.configService.get<string>('PLATFORM_URL') ?? 'https://steeze.com'
    ).replace(/\/$/, '');
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateSlug(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
