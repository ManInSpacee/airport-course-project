import type { FlightStatus } from '../api/types'

const LABELS: Record<FlightStatus, string> = {
  SCHEDULED: 'По расписанию',
  BOARDING: 'Посадка',
  DEPARTED: 'Вылетел',
  ARRIVED: 'Прилетел',
  DELAYED: 'Задержан',
  CANCELLED: 'Отменён',
}

export function Status({ status }: { status: FlightStatus }) {
  return (
    <span className={`st st-${status.toLowerCase()}`}>
      <span className="d" />
      {LABELS[status]}
    </span>
  )
}
