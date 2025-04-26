import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/authOptions'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login?callbackUrl=/orders')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rendeléseim</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rendelés azonosító</th>
                <th className="text-left py-3 px-4">Dátum</th>
                <th className="text-left py-3 px-4">Összeg</th>
                <th className="text-left py-3 px-4">Státusz</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 px-4" colSpan={4}>
                  <p className="text-gray-500 text-center">Még nincsenek rendelések.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 
