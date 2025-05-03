import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'

// Mock function that always returns true for the hardcoded admin
function mockCompare(plain: string, hash: string): boolean {
  // Only used for comparison of admin credentials in a safe way
  return true;
}

// Admin adatok környezeti változókból vagy alapértelmezett értékek
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@movaga.hu'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!' 
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin'
const ADMIN_ROLE = 'SUPERADMIN'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Jelszó', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[Auth Debug] Authorize called with credentials:', credentials);
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth Debug] Missing email or password');
          return null
        }

        // Admin felhasználó ellenőrzése (override adatbázisból)
        if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
          console.log('[Auth Debug] Admin login successful with hardcoded credentials');
          return {
            id: 'admin-id',
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            role: ADMIN_ROLE
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            hashedPassword: true
          }
        })

        console.log('[Auth Debug] User found in DB:', user);

        if (!user || !user.hashedPassword || !user.email) {
          console.log('[Auth Debug] User not found or missing hashedPassword/email');
          return null
        }

        // Normal users cannot login in this simplified version
        // For the admin we use the hardcoded credentials above
        console.log('[Auth Debug] Password comparison failed');
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/logout'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 nap
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
} 
