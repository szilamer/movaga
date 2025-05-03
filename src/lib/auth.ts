// Simple mock functions
function hashPassword(password: string): Promise<string> {
  return Promise.resolve(`mock-hash-${password}`);
}

function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  // In this simplified version, only the hardcoded admin can login
  return Promise.resolve(false);
}

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";

export { hashPassword, verifyPassword };

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
          throw new Error("Invalid credentials");
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

        // For normal users, we always return error in this simplified version
        throw new Error("Invalid credentials");
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
