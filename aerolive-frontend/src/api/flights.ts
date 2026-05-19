import { api } from "./client";
import type { Flight, FlightStatus } from "./types";

export interface FlightFilters {
  status?: string;
  origin?: string;
  destination?: string;
  gateId?: string;
}

export interface FlightInput {
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  gateId?: number | null;
  airlineName?: string | null;
  airlineCode?: string | null;
  aircraftModel?: string | null;
  aircraftRegistration?: string | null;
}

function toApi(data: FlightInput) {
  return {
    flight_number: data.flightNumber,
    origin: data.origin,
    destination: data.destination,
    departure_time: data.departureTime,
    arrival_time: data.arrivalTime,
    gate_id: data.gateId,
    airline_name: data.airlineName,
    airline_code: data.airlineCode,
    aircraft_model: data.aircraftModel,
    aircraft_registration: data.aircraftRegistration,
  };
}

export const flightsApi = {
  list: (filters: FlightFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.origin) params.set("origin", filters.origin);
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.gateId) params.set("gate_id", filters.gateId);
    const q = params.toString();
    return api.get<Flight[]>(`/flights${q ? "?" + q : ""}`);
  },

  get: (id: number) => api.get<Flight>(`/flights/${id}`),

  create: (data: FlightInput) => api.post<Flight>("/flights", toApi(data)),

  update: (id: number, data: FlightInput) => api.put<Flight>(`/flights/${id}`, toApi(data)),

  changeStatus: (id: number, status: FlightStatus) =>
    api.patch<Flight>(`/flights/${id}/status`, { status }),

  delete: (id: number) => api.delete<void>(`/flights/${id}`),
};
