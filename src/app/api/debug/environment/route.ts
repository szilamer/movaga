import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

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
    
    // Return masked environment variables related to email
    return NextResponse.json({
      message: "Environment variables retrieved",
      email: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_FROM: process.env.SMTP_FROM,
        SMTP_PASS: process.env.SMTP_PASS ? '******' : undefined,
      },
      database: {
        DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : undefined,
      },
      node: {
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error("Error retrieving environment variables:", error);
    return NextResponse.json(
      { error: "Failed to retrieve environment variables" },
      { status: 500 }
    );
  }
} 