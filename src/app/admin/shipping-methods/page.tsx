import ShippingMethodList from '@/components/admin/shipping-methods/ShippingMethodList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { redirect } from 'next/navigation';

export default async function ShippingMethodsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
    redirect('/');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Szállítási módok kezelése</h1>
      </div>
      
      <ShippingMethodList />
    </div>
  );
} 