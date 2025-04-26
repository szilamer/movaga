'use client'

import React from 'react'

interface NetworkMember {
  id: string
  name: string
  email: string
  monthlySales: number
  joinedAt: string
}

interface NetworkStatsProps {
  members: NetworkMember[]
  totalSales: number
}

export default function NetworkStats({ members, totalSales }: NetworkStatsProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Hálózati statisztikák</h3>
        <p className="mt-1 text-sm text-gray-500">
          Részletes információk a hálózatodról
        </p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Tagok száma</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {members.length} fő
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Összes hálózati forgalom
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {totalSales.toLocaleString('hu-HU')} Ft
            </dd>
          </div>
        </dl>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          Hálózati tagok
        </h4>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {members.map((member, memberIdx) => (
              <li key={member.id}>
                <div className="relative pb-8">
                  {memberIdx !== members.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-8 ring-white">
                        {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          {member.name || member.email}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <p>
                          {member.monthlySales.toLocaleString('hu-HU')} Ft
                        </p>
                        <p className="text-xs">
                          {new Date(member.joinedAt).toLocaleDateString('hu-HU')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 
