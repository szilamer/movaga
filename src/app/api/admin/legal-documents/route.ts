import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { privacyPolicy, termsOfService } = body;

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'homepage');

    // Save privacy policy if provided
    if (privacyPolicy !== undefined) {
      const privacyPath = join(uploadsDir, 'adatvedelem.md');
      await writeFile(privacyPath, privacyPolicy, 'utf8');
    }

    // Save terms of service if provided
    if (termsOfService !== undefined) {
      const termsPath = join(uploadsDir, 'aszf.md');
      await writeFile(termsPath, termsOfService, 'utf8');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Jogi dokumentumok sikeresen mentve!' 
    });

  } catch (error) {
    console.error('Error saving legal documents:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jogi dokumentumok mentése során' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'homepage');
    
    let privacyPolicy = '';
    let termsOfService = '';

    try {
      const fs = require('fs');
      const privacyPath = join(uploadsDir, 'adatvedelem.md');
      const termsPath = join(uploadsDir, 'aszf.md');

      if (fs.existsSync(privacyPath)) {
        privacyPolicy = fs.readFileSync(privacyPath, 'utf8');
      }

      if (fs.existsSync(termsPath)) {
        termsOfService = fs.readFileSync(termsPath, 'utf8');
      }
    } catch (error) {
      console.error('Error reading legal documents:', error);
    }

    return NextResponse.json({
      privacyPolicy,
      termsOfService
    });

  } catch (error) {
    console.error('Error loading legal documents:', error);
    return NextResponse.json(
      { error: 'Hiba történt a jogi dokumentumok betöltése során' },
      { status: 500 }
    );
  }
} 