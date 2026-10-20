import crypto from "crypto";

function getUnsubscribeSecret(): string {
  const secret =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Chiave segreta non configurata per la generazione dei token di disiscrizione (richiesta SUPABASE_SERVICE_ROLE_KEY o NEWSLETTER_UNSUBSCRIBE_SECRET)."
    );
  }

  return secret;
}

/**
 * Genera un token HMAC per consentire la disiscrizione sicura dall'email
 */
export function generateUnsubscribeToken(userId: string): string {
  return crypto
    .createHmac("sha256", getUnsubscribeSecret())
    .update(`unsubscribe:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verifica la validità del token di disiscrizione
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  try {
    const expected = generateUnsubscribeToken(userId);
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expected);
    if (tokenBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}
