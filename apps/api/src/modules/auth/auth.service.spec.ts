import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const hashOf = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mailMock = { send: jest.fn() };

  const configMock = {
    get: jest.fn((key: string) =>
      key === 'PLATFORM_URL' ? 'https://steeze.test' : undefined,
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue([]);
    mailMock.send.mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verify: jest.fn() },
        },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('forgotPassword', () => {
    it('returns the same response for an unknown email and sends nothing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(result.message).toBe(
        'If the email exists, a reset link has been sent',
      );
      expect(mailMock.send).not.toHaveBeenCalled();
      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('returns the same response for a known email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'someone@example.com',
        firstName: 'Ada',
        isActive: true,
      });

      const result = await service.forgotPassword('someone@example.com');

      expect(result.message).toBe(
        'If the email exists, a reset link has been sent',
      );
      expect(mailMock.send).toHaveBeenCalledTimes(1);
    });

    it('stores only the hash of the emailed token', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'someone@example.com',
        firstName: 'Ada',
        isActive: true,
      });

      await service.forgotPassword('someone@example.com');

      const emailedLink = mailMock.send.mock.calls[0][0].html as string;
      const emailedToken = /token=([a-f0-9]+)/.exec(emailedLink)?.[1];
      const stored = prismaMock.passwordResetToken.create.mock.calls[0][0].data;

      expect(emailedToken).toBeDefined();
      expect(stored.tokenHash).toBe(hashOf(emailedToken as string));
      expect(stored.tokenHash).not.toBe(emailedToken);
    });

    it('retires outstanding tokens so only the newest link works', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'someone@example.com',
        firstName: 'Ada',
        isActive: true,
      });

      await service.forgotPassword('someone@example.com');

      expect(prismaMock.passwordResetToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', usedAt: null },
        }),
      );
    });

    it('does not send to a deactivated account', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'someone@example.com',
        firstName: 'Ada',
        isActive: false,
      });

      await service.forgotPassword('someone@example.com');

      expect(mailMock.send).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown token', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('nope', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a token that was already used', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('used', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired token', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword('expired', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });

    it('stores a hash of the new password and burns the token', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await service.resetPassword('valid', 'NewPass123!');

      // Both writes go through a single transaction so a crash cannot leave
      // the password changed with the token still live.
      expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(2);
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.passwordResetToken.update).toHaveBeenCalledTimes(1);

      const storedHash =
        prismaMock.user.update.mock.calls[0][0].data.passwordHash;
      expect(storedHash).not.toBe('NewPass123!');
      await expect(bcrypt.compare('NewPass123!', storedHash)).resolves.toBe(
        true,
      );

      expect(
        prismaMock.passwordResetToken.update.mock.calls[0][0].data.usedAt,
      ).toBeInstanceOf(Date);
    });

    it('looks the token up by its hash, never by the raw value', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('raw-token', 'NewPass123!'),
      ).rejects.toThrow();

      expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashOf('raw-token') },
      });
    });
  });

  describe('verifyEmail', () => {
    it('rejects an expired link', async () => {
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail('expired')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marks the user verified and burns the token', async () => {
      prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      const result = await service.verifyEmail('valid');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isEmailVerified: true },
      });
      expect(result.message).toContain('verified');
    });
  });

  describe('sendEmailVerification', () => {
    it('does nothing when the address is already verified', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'someone@example.com',
        firstName: 'Ada',
        isEmailVerified: true,
      });

      const result = await service.sendEmailVerification('user-1');

      expect(result.message).toBe('Email is already verified');
      expect(mailMock.send).not.toHaveBeenCalled();
    });
  });
});
