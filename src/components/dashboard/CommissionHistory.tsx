'use client'

import React from 'react'

interface Commission {
  id: string
  amount: number
  type: 'personal' | 'network'
  createdAt: string
  description: string
}

interface CommissionHistoryProps {
  commissions: Commission[]
  totalCommission: number
}

export default function CommissionHistory({
  commissions,
  totalCommission,
}: CommissionHistoryProps) {
  return (
    <div className="bg-background border-border text-foreground shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-foreground">Jutalék történet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Az elmúlt időszak jutalékai
        </p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Összes jutalék
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {totalCommission.toLocaleString('hu-HU')} Ft
            </dd>
          </div>
        </dl>
      </div>
      <div className="px-4 py-5 sm:px-6">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {commissions.map((commission, idx) => (
              <li key={commission.id}>
                <div className="relative pb-8">
                  {idx !== commissions.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-border ${
                          commission.type === 'personal'
                            ? 'bg-green-100'
                            : 'bg-primary/10'
                        }`}
                      >
                        {commission.type === 'personal' ? 'P' : 'N'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {commission.description}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <p className="font-medium">
                          {commission.amount.toLocaleString('hu-HU')} Ft
                        </p>
                        <p className="text-xs">
                          {new Date(commission.createdAt).toLocaleDateString(
                            'hu-HU'
                          )}
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
