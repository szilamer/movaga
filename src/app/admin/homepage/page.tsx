import { HomepageEditor } from '@/components/admin/HomepageEditor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { redirect } from 'next/navigation';
import { getHomepageSettings, type HomepageSettings } from '@/lib/settings';

export default async function HomepageEditorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
    return null;
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    redirect('/');
    return null;
  }

  // Lekérjük a jelenlegi beállításokat közvetlenül a fájlrendszerből
  const settings: HomepageSettings = await getHomepageSettings();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Főoldal szerkesztése</h1>
      <HomepageEditor initialSettings={settings} />
    </div>
  );
} 