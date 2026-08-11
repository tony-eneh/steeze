import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * SMTP delivery. When SMTP is not configured (local dev, CI) messages are
 * logged instead of sent so nothing in the calling code has to branch.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP is not configured; outbound email will be logged instead of sent',
      );
      return;
    }

    const port = this.config.get<number>('SMTP_PORT') ?? 587;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(message: MailMessage): Promise<boolean> {
    const from = this.config.get<string>('EMAIL_FROM') ?? 'noreply@steeze.com';

    if (!this.transporter) {
      // Outside production, surface any action link so local and CI flows that
      // depend on an emailed token can still be completed.
      const link =
        this.config.get<string>('NODE_ENV') === 'production'
          ? ''
          : (message.html.match(/https?:\/\/[^"'\s<]+/) ?? [''])[0];

      this.logger.log(
        `[email skipped] to=${message.to} subject="${message.subject}"` +
          (link ? ` link=${link}` : ''),
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text ?? stripHtml(message.html),
      });
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // Email delivery must never take down the request that triggered it.
      this.logger.error(`Failed to send email to ${message.to}: ${reason}`);
      return false;
    }
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
