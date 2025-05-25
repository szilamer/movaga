'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Bejelentkezés
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError('Hibás email cím vagy jelszó');
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        // Regisztráció
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Hiba történt a regisztráció során');
        } else {
          // Automatikus bejelentkezés regisztráció után
          const loginResult = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (loginResult?.error) {
            setError('Sikeres regisztráció, de a bejelentkezés sikertelen');
          } else {
            onSuccess?.();
            onClose();
          }
        }
      }
    } catch (err) {
      setError('Hiba történt a művelet során');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <h2 className="text-2xl font-bold text-center">
            {isLogin ? 'Bejelentkezés' : 'Regisztráció'}
          </h2>
          <p className="text-center text-muted-foreground">
            {isLogin
              ? 'Jelentkezz be a vásárlás folytatásához'
              : 'Hozz létre egy fiókot a vásárlás folytatásához'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Teljes név
              </label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Add meg a neved"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email cím
            </label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="pelda@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Jelszó
            </label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="********"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading
              ? 'Folyamatban...'
              : isLogin
              ? 'Bejelentkezés'
              : 'Regisztráció'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? 'Még nincs fiókod? Regisztrálj'
                : 'Már van fiókod? Jelentkezz be'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 