import { api } from './client'
import type { User, Role } from './types'

export const usersApi = {
  list: () =>
    api.get<User[]>('/users'),

  changeRole: (id: number, role: Role) =>
    api.patch<User>(`/users/${id}/role`, { role }),

  delete: (id: number) =>
    api.delete<void>(`/users/${id}`),
}
