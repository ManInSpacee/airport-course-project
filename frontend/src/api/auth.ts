import { api } from './client'
import type { User } from './types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),

  register: (username: string, email: string, password: string, role: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { username, email, password, role }),
}
