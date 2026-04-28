import { api } from './client'
import type { User, Role } from './types'

export const usersApi = {
  list: () =>
    api.get<User[]>('/users'),

  create: (data: { username: string; email: string; password: string; role: Role }) =>
    api.post<User>('/users', data),

  changeRole: (id: number, role: Role) =>
    api.patch<User>(`/users/${id}/role`, { role }),

  delete: (id: number) =>
    api.delete<void>(`/users/${id}`),
}
