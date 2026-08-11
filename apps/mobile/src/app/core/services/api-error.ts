/**
 * Pulls the message the API sent back. Every error response is shaped
 * { success: false, message: string, statusCode: number }, so surfacing that
 * beats showing a generic failure the user cannot act on.
 */
export function readApiError(error: unknown, fallback: string): string {
  const message = (error as { error?: { message?: unknown } })?.error?.message;

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  // class-validator returns an array of constraint messages.
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return fallback;
}
