import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verify admin privileges
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Nincs jogosultságod ehhez a művelethez" },
        { status: 403 }
      );
    }
    
    const results = [];
    
    // Közvetlen SQL futtatása a Prisma Client$queryRaw metódussal
    try {
      // 1. Ellenőrizzük, hogy a mező létezik-e már
      const checkColumn = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'shippingEmail'
      `;
      
      // @ts-ignore
      const columnExists = checkColumn.length > 0;
      results.push(`Column check: ${columnExists ? 'shippingEmail exists' : 'shippingEmail does not exist'}`);
      
      if (!columnExists) {
        // 2. Hozzáadjuk a mezőt
        await prisma.$executeRaw`ALTER TABLE "Order" ADD COLUMN "shippingEmail" TEXT`;
        results.push('Added shippingEmail column as nullable');
        
        // 3. Frissítjük az értékeit
        await prisma.$executeRaw`
          UPDATE "Order" SET "shippingEmail" = COALESCE(
            (SELECT "email" FROM "users" WHERE "users"."id" = "Order"."userId"),
            'info@movaga.hu'
          )
        `;
        results.push('Updated existing records with email values');
        
        // 4. NOT NULL constraint hozzáadása
        await prisma.$executeRaw`ALTER TABLE "Order" ALTER COLUMN "shippingEmail" SET NOT NULL`;
        results.push('Set shippingEmail to NOT NULL');
      } else {
        results.push('Column already exists, checking for null values');
        
        // Ellenőrizzük a null értékeket
        const nullCheck = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "Order" WHERE "shippingEmail" IS NULL
        `;
        
        // @ts-ignore
        const nullCount = parseInt(nullCheck[0].count);
        results.push(`Found ${nullCount} records with NULL shippingEmail`);
        
        if (nullCount > 0) {
          // Frissítjük a null értékeket
          await prisma.$executeRaw`
            UPDATE "Order" SET "shippingEmail" = COALESCE(
              (SELECT "email" FROM "users" WHERE "users"."id" = "Order"."userId"),
              'info@movaga.hu'
            ) WHERE "shippingEmail" IS NULL
          `;
          results.push('Updated NULL records with email values');
        }
      }
      
      // 5. Alkalmazzuk a sémamódosításokat
      const dbPushResult = await execAsync('npx prisma db push');
      results.push(`Prisma db push output: ${dbPushResult.stdout}`);
      
    } catch (sqlError) {
      results.push(`SQL error: ${sqlError instanceof Error ? sqlError.message : String(sqlError)}`);
    }
    
    return NextResponse.json({
      message: "Schema fix operations completed",
      results
    });
  } catch (error) {
    console.error("Error fixing schema:", error);
    return NextResponse.json(
      { 
        error: "Failed to fix schema",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 