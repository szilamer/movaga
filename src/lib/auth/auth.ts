// Szerveres modul - dinamikus importálás
let hashPassword: (password: string) => Promise<string>;
let verifyPassword: (plain: string, hashed: string) => Promise<boolean>;

// Csak a szerveroldalon importáljuk a bcrypt-et
if (typeof window === 'undefined') {
  import('bcrypt').then((bcrypt) => {
    const SALT_ROUNDS = 10;
    hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);
    verifyPassword = bcrypt.compare;
  });
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
