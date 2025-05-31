import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email cím megadása kötelező' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Érvényes email címet adj meg' },
        { status: 400 }
      );
    }

    // Create reset token
    const result = await createPasswordResetToken(normalizedEmail);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Hiba történt a jelszó visszaállítás során. Próbáld újra később.' },
        { status: 500 }
      );
    }

    // Send email if token was created successfully and email exists
    if (result.token) {
      try {
        await sendPasswordResetEmail(normalizedEmail, result.token);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email sending fails
        // User will still be notified that email was sent
      }
    }

    // Always return success for security reasons (don't reveal if email exists)
    return NextResponse.json({
      message: 'Ha az email cím létezik a rendszerben, küldtünk egy jelszó visszaállító linket.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Szerver hiba történt. Próbáld újra később.' },
      { status: 500 }
    );
  }
} 