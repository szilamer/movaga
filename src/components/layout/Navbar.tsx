'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CartButton } from '@/components/cart/CartButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut, useSession } from "next-auth/react"

const navigation = [
  { name: 'Termékek', href: '/products' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Hálózat', href: '/network' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: 'https://movaga.hu'
      });
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-700 bg-black shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Bal oldali elemek */}
        <div className="flex flex-1 items-center">
          <Link href="/" className="mr-8 text-xl font-bold text-primary">
            MOVAGA
          </Link>

          <div className="flex space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-white hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Jobb oldali elemek */}
        <div className="flex items-center space-x-4">
          <CartButton />

          {status === "authenticated" && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center space-x-1 rounded-full bg-gray-100 px-2 py-1 hover:bg-gray-200 transition-colors">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {session.user.name?.[0] || 'U'}
                  </span>
                  <span className="px-2 text-sm font-medium">{session.user.name || 'Felhasználó'}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    Beállítások
                  </Link>
                </DropdownMenuItem>
                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Adminisztráció</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  Kijelentkezés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Bejelentkezés
              </Link>
              <Link 
                href="/auth/register"
                className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Regisztráció
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 
