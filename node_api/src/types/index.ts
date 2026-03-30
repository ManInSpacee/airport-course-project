export type UserRole = 'ADMIN' | 'DISPATCHER'

export interface JwtPayload {
  id: number
  username: string
  email: string
  role: UserRole
}

// Расширяем тип Request в Express — добавляем поле user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
