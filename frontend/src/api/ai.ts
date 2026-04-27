import { api } from './client'
import type { RiskResult } from './types'

export const aiApi = {
  getRisk: (flightId: number) => api.post<RiskResult>('/ai/delay-risk', { flight_id: flightId }),
}
