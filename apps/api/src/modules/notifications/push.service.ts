import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, initializeApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { PrismaService } from '../prisma/prisma.service';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Firebase Cloud Messaging delivery. Without Firebase credentials the service
 * stays dormant and every send is a no-op, so local and CI runs need no setup.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private app: App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase is not configured; push notifications are disabled',
      );
      return;
    }

    try {
      this.app = initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            // Env vars carry the key with literal \n sequences.
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        },
        'steeze-push',
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialise Firebase: ${reason}`);
    }
  }

  get isConfigured(): boolean {
    return this.app !== null;
  }

  /**
   * Sends to every device registered for the user. Tokens rejected by FCM as
   * permanently invalid are pruned so they are not retried forever.
   */
  async sendToUser(userId: string, message: PushMessage): Promise<number> {
    if (!this.app) {
      return 0;
    }

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (devices.length === 0) {
      return 0;
    }

    const tokens = devices.map((device) => device.token);

    try {
      const response = await getMessaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title: message.title, body: message.body },
        data: message.data ?? {},
      });

      const staleTokens = response.responses
        .map((result, index) =>
          !result.success && isUnregistered(result.error?.code)
            ? tokens[index]
            : null,
        )
        .filter((token): token is string => token !== null);

      if (staleTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: staleTokens } },
        });
      }

      return response.successCount;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Push delivery failed for user ${userId}: ${reason}`);
      return 0;
    }
  }
}

function isUnregistered(code?: string): boolean {
  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/invalid-argument'
  );
}
