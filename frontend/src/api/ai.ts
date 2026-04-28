import { client } from './client'
import type { RiskResult } from './types'

export const aiApi = {
  getRisk: (flightId: number) =>
    client.post<RiskResult>('/ai/delay-risk', { flight_id: flightId }).then((r) => r.data),
}
