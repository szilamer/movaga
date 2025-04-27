'use client'

import { useSession } from 'next-auth/react'

export default function RoleDebug() {
  const { data: session, status } = useSession()
  
  const user = session?.user ? {
    ...session.user,
    role: session.user.role || 'USER'
  } : null

  return (
    <div className="fixed top-20 right-4 bg-black p-4 text-white z-50 rounded-md">
      <h3 className="text-lg font-bold mb-2">Debug Info</h3>
      <p>Status: {status}</p>
      <p>User ID: {user?.id || 'Not logged in'}</p>
      <p>User Role: {user?.role || 'None'}</p>
      <p>Admin/SuperAdmin: {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? 'YES' : 'NO'}</p>
      <p>SuperAdmin: {user?.role === 'SUPERADMIN' ? 'YES' : 'NO'}</p>
      <p>Session: {session ? 'Active' : 'None'}</p>
    </div>
  )
} 