import { api } from './client'
import type { AuditLog } from './types'

export interface AuditFilters {
  entity_type?: string
  user_id?: string
  limit?: number
}

export const auditApi = {
  list: (filters: AuditFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.entity_type) params.set('entity_type', filters.entity_type)
    if (filters.user_id) params.set('user_id', filters.user_id)
    if (filters.limit) params.set('limit', String(filters.limit))
    const q = params.toString()
    return api.get<AuditLog[]>(`/audit${q ? '?' + q : ''}`)
  },
}
