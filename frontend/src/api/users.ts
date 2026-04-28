import { client } from './client'
import type { User, Role } from './types'

export const usersApi = {
  list: () =>
    client.get<User[]>('/users').then((r) => r.data),

  changeRole: (id: number, role: Role) =>
    client.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),

  delete: (id: number) =>
    client.delete<void>(`/users/${id}`).then((r) => r.data),
}
