import crypto from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "notedifede-newsletter-secret-key";

/**
 * Genera un token HMAC per consentire la disiscrizione sicura con 1 clic dall'email
 */
export function generateUnsubscribeToken(userId: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`unsubscribe:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Verifica la validità del token di disiscrizione
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  const expected = generateUnsubscribeToken(userId);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
