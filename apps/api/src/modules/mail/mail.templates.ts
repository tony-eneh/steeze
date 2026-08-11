interface LayoutOptions {
  platformName: string;
  heading: string;
  body: string;
  action?: { label: string; url: string };
  footnote?: string;
}

function layout({
  platformName,
  heading,
  body,
  action,
  footnote,
}: LayoutOptions): string {
  const button = action
    ? `<p style="margin:32px 0;">
         <a href="${action.url}"
            style="background:#111827;color:#ffffff;padding:12px 24px;border-radius:8px;
                   text-decoration:none;font-weight:600;display:inline-block;">
           ${action.label}
         </a>
       </p>
       <p style="color:#6b7280;font-size:13px;line-height:1.6;">
         If the button does not work, paste this link into your browser:<br />
         <span style="word-break:break-all;">${action.url}</span>
       </p>`
    : '';

  const note = footnote
    ? `<p style="color:#6b7280;font-size:13px;line-height:1.6;">${footnote}</p>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <p style="font-weight:700;font-size:18px;color:#111827;margin:0 0 24px;">${platformName}</p>
      <h1 style="font-size:20px;color:#111827;margin:0 0 16px;">${heading}</h1>
      <div style="color:#374151;font-size:15px;line-height:1.6;">${body}</div>
      ${button}
      ${note}
    </div>
  </body>
</html>`;
}

export function passwordResetEmail(options: {
  platformName: string;
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  return {
    subject: `Reset your ${options.platformName} password`,
    html: layout({
      platformName: options.platformName,
      heading: 'Reset your password',
      body: `<p>Hi ${options.firstName},</p>
             <p>We received a request to reset the password on your account.
                This link expires in ${options.expiresInMinutes} minutes.</p>`,
      action: { label: 'Reset password', url: options.resetUrl },
      footnote:
        'If you did not request this, you can ignore this email. Your password stays unchanged.',
    }),
  };
}

export function emailVerificationEmail(options: {
  platformName: string;
  firstName: string;
  verifyUrl: string;
  expiresInHours: number;
}): { subject: string; html: string } {
  return {
    subject: `Confirm your ${options.platformName} email address`,
    html: layout({
      platformName: options.platformName,
      heading: 'Confirm your email address',
      body: `<p>Hi ${options.firstName},</p>
             <p>Confirm this email address to finish setting up your
                ${options.platformName} account. This link expires in
                ${options.expiresInHours} hours.</p>`,
      action: { label: 'Confirm email', url: options.verifyUrl },
    }),
  };
}

export function notificationEmail(options: {
  platformName: string;
  title: string;
  body: string;
  actionUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: options.title,
    html: layout({
      platformName: options.platformName,
      heading: options.title,
      body: `<p>${options.body}</p>`,
      action: options.actionUrl
        ? { label: 'View in Steeze', url: options.actionUrl }
        : undefined,
    }),
  };
}
