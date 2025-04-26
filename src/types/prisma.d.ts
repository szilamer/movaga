import { Prisma } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type ProductVariations = Record<string, any>;
    type ProductAttributes = Record<string, any>;
  }
}

declare module '@prisma/client' {
  type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
} 
