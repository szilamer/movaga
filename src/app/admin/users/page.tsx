import { UserList } from '@/components/admin/UserList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { redirect } from 'next/navigation';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    redirect('/');
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Felhasználók</h1>
      <UserList />
    </div>
  );
} 