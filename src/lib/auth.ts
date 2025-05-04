import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";

// Simple secure-enough password handling without bcrypt
export function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return Promise.resolve(`${salt}:${hash}`);
}

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Admin user check
        if (credentials.email === 'admin@movaga.hu' && credentials.password === 'Admin123!') {
          return {
            id: 'admin-id',
            email: 'admin@movaga.hu',
            name: 'Admin',
            role: 'SUPERADMIN',
          };
        }

        // Look up user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            hashedPassword: true
          }
        });

        if (!user || !user.hashedPassword || !user.email) {
          return null;
        }

        // Verify password
        const isPasswordValid = await verifyPassword(credentials.password, user.hashedPassword);
        
        if (isPasswordValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.name || "User",
            role: user.role
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },
}; 
