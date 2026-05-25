import { describe, it, expect } from 'vitest'
import { validateFlightBody } from '../utils/validateFlight'

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000).toISOString()
}

const validBody = {
  flight_number: 'SU-101',
  origin: 'Москва (SVO)',
  destination: 'Сочи (AER)',
  departure_time: hoursFromNow(2),
  arrival_time: hoursFromNow(4),
}

const farFuture = new Date()
farFuture.setFullYear(farFuture.getFullYear() + 10)

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
    expect(validateFlightBody({ ...validBody, destination: 'Москва (SVO)' }))
      .toBe('Откуда и куда не могут совпадать')
  })

  it('ошибка если время прилёта раньше вылета', () => {
    expect(validateFlightBody({ ...validBody, arrival_time: hoursFromNow(1) }))
      .toBe('Время прилёта должно быть позже времени вылета')
  })

  it('ошибка если время прилёта равно времени вылета', () => {
    expect(validateFlightBody({ ...validBody, arrival_time: validBody.departure_time }))
      .toBe('Время прилёта должно быть позже времени вылета')
  })

  it('ошибка если название города слишком короткое', () => {
    expect(validateFlightBody({ ...validBody, origin: 'А' }))
      .toBe('Откуда: от 2 до 100 символов')
  })

  it('ошибка если название пункта назначения слишком короткое', () => {
    expect(validateFlightBody({ ...validBody, destination: 'Я' }))
      .toBe('Куда: от 2 до 100 символов')
  })

  it('ошибка если дата вылета невалидна', () => {
    expect(validateFlightBody({ ...validBody, departure_time: 'не-дата' }))
      .toBe('Некорректная дата вылета')
  })

  it('ошибка если год вылета слишком далеко в будущем', () => {
    const dep = farFuture.toISOString()
    const arr = new Date(farFuture.getTime() + 2 * 3600000).toISOString()
    expect(validateFlightBody({ ...validBody, departure_time: dep, arrival_time: arr }))
      .toContain('Год вылета не может быть позднее')
  })
})
