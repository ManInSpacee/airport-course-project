import { client } from './client'
import type { Gate } from './types'

export const gatesApi = {
  list: () =>
    client.get<Gate[]>('/gates').then((r) => r.data),

  create: (data: { name: string; terminal: string }) =>
    client.post<Gate>('/gates', data).then((r) => r.data),

  update: (id: number, data: { name: string; terminal: string }) =>
    client.put<Gate>(`/gates/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete<void>(`/gates/${id}`).then((r) => r.data),
}
