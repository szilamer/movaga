import { NextRequest, NextResponse } from 'next/server';
import { verifyResetToken, resetUserPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Minden mező kitöltése kötelező' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'A jelszavak nem egyeznek' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' },
        { status: 400 }
      );
    }

    // Verify the reset token
    const tokenResult = await verifyResetToken(token);
    
    if (!tokenResult.success || !tokenResult.userId) {
      return NextResponse.json(
        { error: 'Érvénytelen vagy lejárt token' },
        { status: 400 }
      );
    }

    // Reset the password
    const resetResult = await resetUserPassword(tokenResult.userId, password);
    
    if (!resetResult.success) {
      return NextResponse.json(
        { error: 'Hiba történt a jelszó megváltoztatása során. Próbáld újra később.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'A jelszó sikeresen megváltoztatva. Most már bejelentkezhetsz az új jelszavaddal.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Szerver hiba történt. Próbáld újra később.' },
      { status: 500 }
    );
  }
} 