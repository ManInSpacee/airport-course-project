import { api } from './client'
import type { Gate } from './types'

export const gatesApi = {
  list: () => api.get<Gate[]>('/gates'),
  create: (data: { name: string; terminal: string }) => api.post<Gate>('/gates', data),
  update: (id: number, data: { name: string; terminal: string }) => api.put<Gate>(`/gates/${id}`, data),
  delete: (id: number) => api.delete<void>(`/gates/${id}`),
}
