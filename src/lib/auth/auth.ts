// Simple mock functions without bcrypt
export function hashPassword(password: string): Promise<string> {
  return Promise.resolve(`mock-hash-${password}`);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  // In this simplified version, only the hardcoded admin can login
  return Promise.resolve(false);
}

export async function generateToken(length: number = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
} 
