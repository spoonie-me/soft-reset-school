import crypto from 'crypto';

/** Hardship codes are stateless: "<nonce>.<signature>". The nonce becomes the
 * purchase's stripeSessionId, which is unique, so a code works exactly once
 * with no new table. Issue them with `npm run hardship:code`. */
function secret(): string | null {
  return process.env.HARDSHIP_CODE_SECRET || null;
}

function sign(nonce: string, key: string): string {
  return crypto.createHmac('sha256', key).update(nonce).digest('base64url').slice(0, 16);
}

export function createHardshipCode(): string {
  const key = secret();
  if (!key) throw new Error('HARDSHIP_CODE_SECRET is not set');
  const nonce = crypto.randomBytes(6).toString('base64url');
  return `${nonce}.${sign(nonce, key)}`;
}

/** Returns the nonce when the code is genuine, otherwise null. */
export function verifyHardshipCode(code: unknown): string | null {
  const key = secret();
  if (!key || typeof code !== 'string') return null;
  const [nonce, sig, ...rest] = code.trim().split('.');
  if (!nonce || !sig || rest.length > 0) return null;
  const expected = Buffer.from(sign(nonce, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return nonce;
}
