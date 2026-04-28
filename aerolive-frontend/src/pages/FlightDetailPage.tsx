import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { flightsApi } from '../api/flights'
import type { Flight, FlightStatus } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { Status } from '../components/Status'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ALL_STATUSES: FlightStatus[] = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'DELAYED', 'CANCELLED']

export function FlightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { showToast } = useToast()

  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<FlightStatus>('SCHEDULED')
  const [deleteModal, setDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    flightsApi.get(Number(id))
      .then(f => { setFlight(f); setNewStatus(f.status) })
      .catch(err => showToast(err.message, 'err'))
      .finally(() => setLoading(false))
  }, [id, showToast])

  async function applyStatus() {
    if (!flight) return
    setActionLoading(true)
    try {
      const updated = await flightsApi.changeStatus(flight.id, newStatus)
      setFlight(updated)
      setStatusModal(false)
      showToast('Статус изменён')
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setActionLoading(false)
    }
  }

  async function confirmDelete() {
    if (!flight) return
    setActionLoading(true)
    try {
      await flightsApi.delete(flight.id)
      showToast('Рейс удалён')
      navigate('/flights')
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setActionLoading(false)
    }
  }

  function fmt(dt: string) {
    return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <Frame><div className="loading">Загрузка...</div></Frame>
  if (!flight) return <Frame><div className="msg err">Рейс не найден</div></Frame>

  return (
    <Frame>
      <div className="breadcrumb">
        <button className="btn link" onClick={() => navigate('/flights')}>← Рейсы</button>
      </div>
      <h1 className="page-title">Рейс {flight.flightNumber}</h1>

      <div className="panel">
        <div className="panel-head">Основная информация</div>
        <div className="panel-body">
          <dl className="dl">
            <dt>Номер рейса</dt><dd>{flight.flightNumber}</dd>
            <dt>Маршрут</dt><dd>{flight.origin} → {flight.destination}</dd>
            <dt>Вылет</dt><dd>{fmt(flight.departureTime)}</dd>
            <dt>Прилёт</dt><dd>{fmt(flight.arrivalTime)}</dd>
            <dt>Гейт</dt><dd>{flight.gate ? `${flight.gate.name} (Терминал ${flight.gate.terminal})` : '—'}</dd>
            <dt>Статус</dt><dd><Status status={flight.status} /></dd>
            <dt>Создан</dt><dd>{flight.createdBy?.username} · {fmt(flight.createdAt)}</dd>
          </dl>
        </div>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={() => navigate(`/flights/${flight.id}/edit`)}>✏️ Редактировать</button>
        <button className="btn" onClick={() => { setNewStatus(flight.status); setStatusModal(true) }}>↕ Изменить статус</button>
        <button className="btn" onClick={() => navigate(`/flights/${flight.id}/risk`)}>⚡ AI-оценка риска</button>
        {isAdmin && (
          <button className="btn danger" onClick={() => setDeleteModal(true)}>🗑 Удалить</button>
        )}
      </div>

      {statusModal && (
        <Modal title={`Изменить статус — ${flight.flightNumber}`} onClose={() => setStatusModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setStatusModal(false)}>Отмена</button>
              <button className="btn primary" onClick={applyStatus} disabled={actionLoading}>Применить</button>
            </>
          }>
          <div className="form-row">
            <label className="lbl">Текущий статус</label>
            <div><Status status={flight.status} /></div>
          </div>
          <div className="form-row">
            <label className="lbl">Новый статус</label>
            <select className="ctl" value={newStatus} onChange={e => setNewStatus(e.target.value as FlightStatus)}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Удалить рейс" onClose={() => setDeleteModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setDeleteModal(false)}>Отмена</button>
              <button className="btn primary danger" onClick={confirmDelete} disabled={actionLoading}>Удалить</button>
            </>
          }>
          <p>Вы уверены, что хотите удалить рейс <strong>{flight.flightNumber}</strong>?</p>
        </Modal>
      )}
    </Frame>
  )
}
