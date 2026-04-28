export type Role = 'ADMIN' | 'DISPATCHER'
export type FlightStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'DELAYED' | 'CANCELLED'
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ROLE_CHANGE'

export interface User {
  id: number
  username: string
  email: string
  role: Role
  createdAt: string
}

export interface Gate {
  id: number
  name: string
  terminal: string
  _count?: { flights: number }
}

export interface Flight {
  id: number
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  status: FlightStatus
  gate?: Gate | null
  createdBy?: User
  createdAt: string
}

export interface AuditLog {
  id: number
  action: ActionType
  entityType: string
  entityId: number
  details: string | null
  createdAt: string
  user: { username: string }
}

export interface RiskResult {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  interpretation: string
  confidence: number
  probabilities: { LOW: number; MEDIUM: number; HIGH: number }
  expected_delay_minutes: number
  reasons: string[]
  features: {
    hour: number
    is_weekend: number
    gate_load: number
    historical_delays: number
  }
}
