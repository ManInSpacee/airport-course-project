const MAX_YEAR = new Date().getFullYear() + 1

export function validateFlightBody(body: any): string | null {
  const { flight_number, origin, destination, departure_time, arrival_time } = body

  if (!flight_number || !origin || !destination || !departure_time || !arrival_time)
    return 'Заполните все обязательные поля'

  if (!/^[A-Z0-9]{1,3}-\d{1,4}$/.test(String(flight_number).trim()))
    return 'Номер рейса: формат XX-NNN (например SU-101, U6-205)'

  if (String(origin).trim().length < 2 || String(origin).trim().length > 100)
    return 'Откуда: от 2 до 100 символов'

  if (String(destination).trim().length < 2 || String(destination).trim().length > 100)
    return 'Куда: от 2 до 100 символов'

  if (String(origin).trim().toLowerCase() === String(destination).trim().toLowerCase())
    return 'Откуда и куда не могут совпадать'

  const dep = new Date(departure_time)
  const arr = new Date(arrival_time)

  if (isNaN(dep.getTime())) return 'Некорректная дата вылета'
  if (isNaN(arr.getTime())) return 'Некорректная дата прилёта'
  if (dep.getFullYear() > MAX_YEAR) return `Год вылета не может быть позднее ${MAX_YEAR}`
  if (arr.getFullYear() > MAX_YEAR) return `Год прилёта не может быть позднее ${MAX_YEAR}`
  if (arr <= dep) return 'Время прилёта должно быть позже времени вылета'

  return null
}
