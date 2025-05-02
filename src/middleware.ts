import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/')
  const isCheckoutPage = request.nextUrl.pathname === '/checkout'
  const isOrdersApi = request.nextUrl.pathname.startsWith('/api/orders')

  // Checkout oldal és orders API vendég vásárlás esetén is elérhető
  if (isCheckoutPage || isOrdersApi) {
    return NextResponse.next()
  }

  // Védett oldalak csak bejelentkezve érhetők el
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/checkout',
    '/api/orders/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/network/:path*'
  ]
} 
