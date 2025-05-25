import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validáció
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Minden mező kitöltése kötelező' },
        { status: 400 }
      );
    }

    // Email formátum ellenőrzése
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Érvénytelen email cím formátum' },
        { status: 400 }
      );
    }

    // Jelszó erősség ellenőrzése
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A jelszónak legalább 8 karakter hosszúnak kell lennie' },
        { status: 400 }
      );
    }

    // Ellenőrizzük, hogy létezik-e már a felhasználó
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ez az email cím már regisztrálva van' },
        { status: 400 }
      );
    }

    // Jelszó hashelése
    const hashedPassword = await hash(password, 12);

    // Felhasználó létrehozása
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: 'USER',
      },
    });

    // Sikeres válasz
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('Regisztrációs hiba:', error);
    return NextResponse.json(
      { error: 'Hiba történt a regisztráció során' },
      { status: 500 }
    );
  }
} 