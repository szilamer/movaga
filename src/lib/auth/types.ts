export interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  monthlySales: number
  discountPercent: number
  referrerId: string | null
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  expires: string
}

export interface Token {
  id: string
  email: string
  name: string
  role: string
  iat: number
  exp: number
  jti: string
} 