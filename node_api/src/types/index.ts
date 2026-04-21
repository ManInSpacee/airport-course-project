export type UserRole = 'ADMIN' | 'DISPATCHER'

export interface JwtPayload {
  id: number
  username: string
  email: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
