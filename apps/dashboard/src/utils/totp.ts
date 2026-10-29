/**
 * RFC 6238 TOTP (Time-based One-Time Password) generation
 * Pure Web Crypto implementation (zero external dependencies).
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

export async function generateTOTP(
  secret: string,
  timeStep = 30
): Promise<{ code: string; secondsRemaining: number; progressPercent: number }> {
  const epochSeconds = Math.floor(Date.now() / 1000);
  const secondsRemaining = timeStep - (epochSeconds % timeStep);
  const progressPercent = Math.round((secondsRemaining / timeStep) * 100);

  try {
    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) {
      return { code: '------', secondsRemaining, progressPercent };
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const counter = Math.floor(epochSeconds / timeStep);
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const sigBytes = new Uint8Array(signature);
    const offset = sigBytes[sigBytes.length - 1] & 0x0f;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const code = otp.toString().padStart(6, '0');

    return { code, secondsRemaining, progressPercent };
  } catch (err) {
    console.error('Failed to generate TOTP:', err);
    return { code: '------', secondsRemaining, progressPercent };
  }
}

export function formatTotpCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}
