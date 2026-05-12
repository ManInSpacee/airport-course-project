import { describe, it, expect } from 'vitest'
import { validateFlightBody } from '../utils/validateFlight'

const validBody = {
  flight_number: 'SU-101',
  origin: 'Москва',
  destination: 'Сочи',
  departure_time: '2026-06-01T10:00:00Z',
  arrival_time: '2026-06-01T12:00:00Z',
}

describe('validateFlightBody', () => {
  it('возвращает null если все поля корректны', () => {
    expect(validateFlightBody(validBody)).toBe(null)
  })

  it('ошибка если поля не заполнены', () => {
    expect(validateFlightBody({})).toBe('Заполните все обязательные поля')
  })

  it('ошибка если номер рейса в неверном формате', () => {
    expect(validateFlightBody({ ...validBody, flight_number: 'abc123' }))
      .toBe('Номер рейса: формат XX-NNN (например SU-101, U6-205)')
  })

  it('ошибка если откуда и куда совпадают', () => {
    expect(validateFlightBody({ ...validBody, destination: 'Москва' }))
      .toBe('Откуда и куда не могут совпадать')
  })

  it('ошибка если время прилёта раньше вылета', () => {
    expect(validateFlightBody({ ...validBody, arrival_time: '2026-06-01T09:00:00Z' }))
      .toBe('Время прилёта должно быть позже времени вылета')
  })
})
