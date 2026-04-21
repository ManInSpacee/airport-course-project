import { api } from './client'
import type { Flight, FlightStatus } from './types'

export interface FlightFilters {
  status?: string
  origin?: string
  destination?: string
  gateId?: string
}

export const flightsApi = {
  list: (filters: FlightFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.origin) params.set('origin', filters.origin)
    if (filters.destination) params.set('destination', filters.destination)
    if (filters.gateId) params.set('gateId', filters.gateId)
    const q = params.toString()
    return api.get<Flight[]>(`/flights${q ? '?' + q : ''}`)
  },

  get: (id: number) => api.get<Flight>(`/flights/${id}`),

  create: (data: {
    flightNumber: string
    origin: string
    destination: string
    departureTime: string
    arrivalTime: string
    gateId?: number | null
  }) => api.post<Flight>('/flights', data),

  update: (id: number, data: {
    flightNumber: string
    origin: string
    destination: string
    departureTime: string
    arrivalTime: string
    gateId?: number | null
  }) => api.put<Flight>(`/flights/${id}`, data),

  changeStatus: (id: number, status: FlightStatus) =>
    api.patch<Flight>(`/flights/${id}/status`, { status }),

  delete: (id: number) => api.delete<void>(`/flights/${id}`),
}
