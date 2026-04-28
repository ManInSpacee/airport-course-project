import { client } from './client'
import type { AuditLog } from './types'

export interface AuditFilters {
  entity_type?: string
  user_id?: string
  limit?: number
}

export const auditApi = {
  list: (filters: AuditFilters = {}) =>
    client.get<AuditLog[]>('/audit', { params: filters }).then((r) => r.data),
}
