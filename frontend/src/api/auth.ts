import { client } from './client'
import type { User } from './types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ token: string; user: User }>('/auth/login', { email, password }).then((r) => r.data),

  register: (username: string, email: string, password: string, role: string) =>
    client.post<{ token: string; user: User }>('/auth/register', { username, email, password, role }).then((r) => r.data),
}
