import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import { compare } from 'bcrypt'

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

        console.log('[Auth Debug] Comparing password:', credentials.password, 'with hash:', user.hashedPassword);
        const isValid = await compare(credentials.password, user.hashedPassword)
        console.log('[Auth Debug] Password validation result (isValid):', isValid);

        if (!isValid) {
          console.log('[Auth Debug] Password comparison failed');
          return null
        }

        console.log('[Auth Debug] Authorization successful, returning user object');
        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role
        }
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
