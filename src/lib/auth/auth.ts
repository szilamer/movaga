// Szerveres modul - dinamikus importálás
let hashPassword: (password: string) => Promise<string>;
let verifyPassword: (plain: string, hashed: string) => Promise<boolean>;

// Csak a szerveroldalon importáljuk a bcrypt-et
if (typeof process === 'object' && typeof window === 'undefined') {
  // Szerver oldali kód
  hashPassword = async (password: string) => {
    try {
      const bcrypt = await import('bcrypt');
      const SALT_ROUNDS = 10;
      return bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      console.error('Failed to import bcrypt:', error);
      return '';
    }
  };

  verifyPassword = async (plain: string, hashed: string) => {
    try {
      const bcrypt = await import('bcrypt');
      return bcrypt.compare(plain, hashed);
    } catch (error) {
      console.error('Failed to import bcrypt:', error);
      return false;
    }
  };
} else {
  // Kliens oldali stub
  hashPassword = () => Promise.resolve('');
  verifyPassword = () => Promise.resolve(false);
}

export { hashPassword, verifyPassword };

export async function generateToken(length: number = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
} 
