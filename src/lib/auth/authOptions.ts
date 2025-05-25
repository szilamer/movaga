import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { verifyPassword } from './auth'

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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Admin felhasználó ellenőrzése (override adatbázisból)
        if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
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

        if (!user || !user.hashedPassword || !user.email) {
          return null
        }

        // Verify the password for regular users
        const isPasswordValid = await verifyPassword(credentials.password, user.hashedPassword);
        
        if (isPasswordValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
        
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/'
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
  debug: false
} 
