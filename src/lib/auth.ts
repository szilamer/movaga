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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.email) {
          throw new Error("Invalid credentials");
        }

        // Ellenőrizzük, hogy a hashedPassword létezik-e
        if (!user.hashedPassword) {
          throw new Error("Account not properly set up");
        }

        const isValid = await verifyPassword(credentials.password, user.hashedPassword);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
        };
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
