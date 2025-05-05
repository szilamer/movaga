import { HomepageEditor } from '@/components/admin/HomepageEditor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { redirect } from 'next/navigation';

export default async function HomepageEditorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    redirect('/');
  }

  // Lekérjük a jelenlegi beállításokat
  let settings;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_URL || `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}`;
    const response = await fetch(`${apiUrl}/api/admin/homepage`, { 
      cache: 'no-store' 
    });
    if (response.ok) {
      settings = await response.json();
    }
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Főoldal szerkesztése</h1>
      <HomepageEditor initialSettings={settings} />
    </div>
  );
} 