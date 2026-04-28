import { client } from './client'
import type { Flight, FlightStatus } from './types'

export interface FlightFilters {
  status?: string
  origin?: string
  destination?: string
  gate_id?: string
}

export const flightsApi = {
  list: (filters: FlightFilters = {}) =>
    client.get<Flight[]>('/flights', { params: filters }).then((r) => r.data),

  get: (id: number) =>
    client.get<Flight>(`/flights/${id}`).then((r) => r.data),

  create: (data: {
    flightNumber: string
    origin: string
    destination: string
    departureTime: string
    arrivalTime: string
    gateId?: number | null
  }) =>
    client.post<Flight>('/flights', {
      flight_number: data.flightNumber,
      origin: data.origin,
      destination: data.destination,
      departure_time: data.departureTime,
      arrival_time: data.arrivalTime,
      gate_id: data.gateId,
    }).then((r) => r.data),

  update: (id: number, data: {
    flightNumber: string
    origin: string
    destination: string
    departureTime: string
    arrivalTime: string
    gateId?: number | null
  }) =>
    client.put<Flight>(`/flights/${id}`, {
      flight_number: data.flightNumber,
      origin: data.origin,
      destination: data.destination,
      departure_time: data.departureTime,
      arrival_time: data.arrivalTime,
      gate_id: data.gateId,
    }).then((r) => r.data),

  changeStatus: (id: number, status: FlightStatus) =>
    client.patch<Flight>(`/flights/${id}/status`, { status }).then((r) => r.data),

  delete: (id: number) =>
    client.delete<void>(`/flights/${id}`).then((r) => r.data),
}
