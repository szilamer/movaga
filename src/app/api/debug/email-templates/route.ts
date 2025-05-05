import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all email templates
    const templates = await prisma.emailTemplate.findMany();
    
    return NextResponse.json({
      message: "Email templates retrieved successfully",
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
} 