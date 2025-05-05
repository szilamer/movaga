import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ellenőrizzük, hogy létezik-e az EmailTemplate tábla
    try {
      // Fetch all email templates
      const templates = await prisma.$queryRaw`
        SELECT * FROM "EmailTemplate"
      `;
      
      return NextResponse.json({
        message: "Email templates retrieved successfully",
        count: Array.isArray(templates) ? templates.length : 0,
        templates
      });
    } catch (error) {
      // Ha a tábla nem létezik vagy más hiba van
      return NextResponse.json({
        message: "Couldn't retrieve email templates",
        error: error instanceof Error ? error.message : String(error),
        fallbackTemplates: {
          PENDING: "Order Confirmation Template",
          PROCESSING: "Order Processing Template",
          SHIPPED: "Order Shipped Template",
          COMPLETED: "Order Completed Template",
          CANCELLED: "Order Cancelled Template"
        }
      });
    }
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
} 