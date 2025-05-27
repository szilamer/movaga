'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ReferralLinkBox() {
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)

  if (!session?.user?.id) {
    return null
  }

  const referralCode = session.user.id
  const referralLink = `${window.location.origin}/auth/register?ref=${referralCode}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Csatlakozz a Movaga hálózathoz!')
    const body = encodeURIComponent(
      `Szia!\n\nMeghívlak, hogy csatlakozz a Movaga hálózathoz. Regisztrálj az alábbi linken keresztül:\n\n${referralLink}\n\nÜdvözlettel,\n${session.user.name || 'Egy Movaga partner'}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Szia! Meghívlak, hogy csatlakozz a Movaga hálózathoz. Regisztrálj az alábbi linken keresztül: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${message}`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Meghívó kód küldése
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            A te meghívó kódod:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralCode}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm transition-colors"
            >
              Másolás
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Meghívó link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm transition-colors"
            >
              {copied ? 'Másolva!' : 'Másolás'}
            </button>
          </div>
        </div>

        {copied && (
          <Alert>
            <AlertDescription>
              A meghívó link sikeresen a vágólapra másolva!
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-3">
            Oszd meg a meghívó linket:
          </p>
          <div className="flex gap-2">
            <button
              onClick={shareViaEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Hogyan működik?</strong><br />
            Amikor valaki a te meghívó linkeddel regisztrál, automatikusan a hálózatod tagja lesz. 
            A vásárlásaik után jutalékpontokat kapsz, és növeled a kedvezményszinted!
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 