import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile')
  }

  // Fetch user with addresses
  const user = await prisma.user.findUnique({
    where: {
      id: session.user?.id
    },
    include: {
      shippingAddress: true,
      billingAddress: true
    }
  })

  if (!user) {
    redirect('/auth/login?callbackUrl=/profile')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profilom</h1>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Személyes adatok</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Név</label>
                  <p className="mt-1 text-lg">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-lg">{user.email}</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Beállítások</h2>
              <Link 
                href="/profile/edit-password" 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
              >
                Jelszó módosítása
              </Link>
            </div>
          </div>
        </div>

        {/* Címadatok megjelenítése */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Mentett címek</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Szállítási cím */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3 flex justify-between items-center">
                <span>Szállítási cím</span>
                <Link 
                  href="/checkout?edit=shipping" 
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Szerkesztés
                </Link>
              </h3>
              
              {user.shippingAddress ? (
                <div className="space-y-2">
                  <p className="font-medium">{user.shippingAddress.fullName}</p>
                  <p>{user.shippingAddress.address}</p>
                  <p>{user.shippingAddress.zipCode} {user.shippingAddress.city}</p>
                  <p>{user.shippingAddress.country}</p>
                  {user.shippingAddress.phone && <p>Tel: {user.shippingAddress.phone}</p>}
                </div>
              ) : (
                <p className="text-gray-500 italic">Nincs mentett szállítási cím</p>
              )}
            </div>
            
            {/* Számlázási cím */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-3 flex justify-between items-center">
                <span>Számlázási cím</span>
                <Link 
                  href="/checkout?edit=billing" 
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Szerkesztés
                </Link>
              </h3>
              
              {user.billingAddress ? (
                <div className="space-y-2">
                  <p className="font-medium">{user.billingAddress.fullName}</p>
                  {user.billingAddress.companyName && (
                    <>
                      <p className="font-medium">{user.billingAddress.companyName}</p>
                      {user.billingAddress.taxNumber && (
                        <p>Adószám: {user.billingAddress.taxNumber}</p>
                      )}
                    </>
                  )}
                  <p>{user.billingAddress.address}</p>
                  <p>{user.billingAddress.zipCode} {user.billingAddress.city}</p>
                  <p>{user.billingAddress.country}</p>
                  {user.billingAddress.phone && <p>Tel: {user.billingAddress.phone}</p>}
                </div>
              ) : (
                <p className="text-gray-500 italic">Nincs mentett számlázási cím</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
