import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { flightsApi, type FlightFilters } from '../api/flights'
import { gatesApi } from '../api/gates'
import { type Flight, type FlightStatus, type Gate } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { Status } from '../components/Status'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ALL_STATUSES: FlightStatus[] = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'DELAYED', 'CANCELLED']

export function FlightsPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [flights, setFlights] = useState<Flight[]>([])
  const [gates, setGates] = useState<Gate[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FlightFilters>({})

  const [statusModal, setStatusModal] = useState<Flight | null>(null)
  const [newStatus, setNewStatus] = useState<FlightStatus>('SCHEDULED')
  const [deleteModal, setDeleteModal] = useState<Flight | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadFlights = useCallback(async () => {
    setLoading(true)
    try {
      setFlights(await flightsApi.list(filters))
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setLoading(false)
    }
  }, [filters, showToast])

  useEffect(() => { loadFlights() }, [loadFlights])
  useEffect(() => { gatesApi.list().then(setGates).catch(() => {}) }, [])

  function openStatusModal(f: Flight) {
    setStatusModal(f)
    setNewStatus(f.status)
  }

  async function applyStatus() {
    if (!statusModal) return
    setActionLoading(true)
    try {
      await flightsApi.changeStatus(statusModal.id, newStatus)
      showToast('Статус изменён')
      setStatusModal(null)
      loadFlights()
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setActionLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteModal) return
    setActionLoading(true)
    try {
      await flightsApi.delete(deleteModal.id)
      showToast('Рейс удалён')
      setDeleteModal(null)
      loadFlights()
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setActionLoading(false)
    }
  }

  function fmt(dt: string) {
    const d = new Date(dt)
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Frame>
      <h1 className="page-title">Рейсы</h1>

      <div className="toolbar">
        <div>
          <label className="lbl">Статус</label>
          <select className="ctl" value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">Все</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Откуда</label>
          <input className="ctl" value={filters.origin || ''} placeholder="Москва"
            onChange={e => setFilters(f => ({ ...f, origin: e.target.value || undefined }))} />
        </div>
        <div>
          <label className="lbl">Куда</label>
          <input className="ctl" value={filters.destination || ''} placeholder="Сочи"
            onChange={e => setFilters(f => ({ ...f, destination: e.target.value || undefined }))} />
        </div>
        <div>
          <label className="lbl">Гейт</label>
          <select className="ctl" value={filters.gateId || ''} onChange={e => setFilters(f => ({ ...f, gateId: e.target.value || undefined }))}>
            <option value="">Все</option>
            {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="spacer" />
        <button className="btn primary" onClick={() => navigate('/flights/new')}>+ Добавить рейс</button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : flights.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Рейсов не найдено</div>
          <div className="empty-sub">Измените фильтры или создайте новый рейс</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Откуда</th>
                <th>Куда</th>
                <th>Вылет</th>
                <th>Прилёт</th>
                <th>Гейт</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {flights.map(f => (
                <tr key={f.id}>
                  <td>{f.flightNumber}</td>
                  <td>{f.origin}</td>
                  <td>{f.destination}</td>
                  <td className="num">{fmt(f.departureTime)}</td>
                  <td className="num">{fmt(f.arrivalTime)}</td>
                  <td>{f.gate?.name ?? '—'}</td>
                  <td><Status status={f.status} /></td>
                  <td className="actions">
                    <button className="btn small" aria-label="Просмотр" onClick={() => navigate(`/flights/${f.id}`)}>👁</button>
                    <button className="btn small" aria-label="Редактировать" onClick={() => navigate(`/flights/${f.id}/edit`)}>✏️</button>
                    <button className="btn small" aria-label="Изменить статус" onClick={() => openStatusModal(f)}>↕</button>
                    <button className="btn small" aria-label="AI-оценка" onClick={() => navigate(`/flights/${f.id}/risk`)}>⚡</button>
                    {isAdmin && (
                      <button className="btn small danger" aria-label="Удалить" onClick={() => setDeleteModal(f)}>🗑</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {statusModal && (
        <Modal title={`Изменить статус — ${statusModal.flightNumber}`} onClose={() => setStatusModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setStatusModal(null)}>Отмена</button>
              <button className="btn primary" onClick={applyStatus} disabled={actionLoading}>Применить</button>
            </>
          }>
          <div className="form-row">
            <label className="lbl">Текущий статус</label>
            <Status status={statusModal.status} />
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
        <Modal title="Удалить рейс" onClose={() => setDeleteModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDeleteModal(null)}>Отмена</button>
              <button className="btn primary danger" onClick={confirmDelete} disabled={actionLoading}>Удалить</button>
            </>
          }>
          <p>Вы уверены, что хотите удалить рейс <strong>{deleteModal.flightNumber}</strong>?</p>
        </Modal>
      )}
    </Frame>
  )
}
