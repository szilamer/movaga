// Simple secure-enough password handling without bcrypt
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hash a password using SHA-256 with a salt
 * This is safer than the mock implementation but less secure than bcrypt
 * It's a compromise for deployability on Render.com
 */
export function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return Promise.resolve(`${salt}:${hash}`);
}

/**
 * Verify a password against a hashed version
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  // Handle the hardcoded admin case
  if (hashed.startsWith('mock-hash-')) {
    const expectedPassword = hashed.replace('mock-hash-', '');
    // Use timing-safe comparison to prevent timing attacks
    try {
      const expected = Buffer.from(expectedPassword);
      const provided = Buffer.from(plain);
      return Promise.resolve(
        expected.length === provided.length && 
        timingSafeEqual(expected, provided)
      );
    } catch (error) {
      return Promise.resolve(false);
    }
  }
  
  // Handle proper hashed passwords
  const [salt, storedHash] = hashed.split(':');
  if (!salt || !storedHash) return Promise.resolve(false);
  
  const calculatedHash = createHash('sha256').update(salt + plain).digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(storedHash);
    const provided = Buffer.from(calculatedHash);
    return Promise.resolve(
      expected.length === provided.length && 
      timingSafeEqual(expected, provided)
    );
  } catch (error) {
    return Promise.resolve(false);
  }
}

export async function generateToken(length: number = 32): Promise<string> {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
} 
