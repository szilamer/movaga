import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/authOptions'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profilom</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Személyes adatok</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Név</label>
                <p className="mt-1 text-lg">{session.user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-lg">{session.user?.email}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Beállítások</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Jelszó módosítása
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 