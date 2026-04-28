import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { flightsApi } from '../api/flights'
import { gatesApi } from '../api/gates'
import type { Gate } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { useToast } from '../context/ToastContext'

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function FlightFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [gates, setGates] = useState<Gate[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [flightNumber, setFlightNumber] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [gateId, setGateId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    gatesApi.list().then(setGates).catch(() => {})
    if (isEdit) {
      flightsApi.get(Number(id))
        .then(f => {
          setFlightNumber(f.flightNumber)
          setOrigin(f.origin)
          setDestination(f.destination)
          setDepartureTime(toLocalInput(f.departureTime))
          setArrivalTime(toLocalInput(f.arrivalTime))
          setGateId(f.gate?.id ? String(f.gate.id) : '')
        })
        .catch(err => showToast(err.message, 'err'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, showToast])

  function validate() {
    const e: Record<string, string> = {}
    if (!flightNumber.trim()) e.flightNumber = 'Обязательное поле'
    if (!origin.trim()) e.origin = 'Обязательное поле'
    if (!destination.trim()) e.destination = 'Обязательное поле'
    const maxYear = new Date().getFullYear() + 1

    if (!departureTime) {
      e.departureTime = 'Обязательное поле'
    } else if (new Date(departureTime).getFullYear() > maxYear) {
      e.departureTime = `Год не может быть позднее ${maxYear}`
    }

    if (!arrivalTime) {
      e.arrivalTime = 'Обязательное поле'
    } else if (new Date(arrivalTime).getFullYear() > maxYear) {
      e.arrivalTime = `Год не может быть позднее ${maxYear}`
    }

    if (departureTime && arrivalTime && arrivalTime <= departureTime)
      e.arrivalTime = 'Время прилёта должно быть позже вылета'

    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const data = {
      flightNumber: flightNumber.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: new Date(departureTime).toISOString(),
      arrivalTime: new Date(arrivalTime).toISOString(),
      gateId: gateId ? Number(gateId) : null,
    }
    try {
      if (isEdit) {
        await flightsApi.update(Number(id), data)
        showToast('Рейс обновлён')
        navigate(`/flights/${id}`)
      } else {
        const created = await flightsApi.create(data)
        showToast('Рейс создан')
        navigate(`/flights/${created.id}`)
      }
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Frame><div className="loading">Загрузка...</div></Frame>

  return (
    <Frame>
      <div className="breadcrumb">
        <button className="btn link" onClick={() => navigate(isEdit ? `/flights/${id}` : '/flights')}>← Назад</button>
      </div>
      <h1 className="page-title">{isEdit ? 'Редактировать рейс' : 'Новый рейс'}</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="form-row">
          <label className="lbl">Номер рейса *</label>
          <input className={`ctl${errors.flightNumber ? ' err' : ''}`} value={flightNumber}
            placeholder="SU-100" onChange={e => setFlightNumber(e.target.value)} />
          {errors.flightNumber && <div className="err-msg">{errors.flightNumber}</div>}
        </div>
        <div className="row">
          <div className="form-row">
            <label className="lbl">Откуда *</label>
            <input className={`ctl${errors.origin ? ' err' : ''}`} value={origin}
              placeholder="Москва" onChange={e => setOrigin(e.target.value)} />
            {errors.origin && <div className="err-msg">{errors.origin}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Куда *</label>
            <input className={`ctl${errors.destination ? ' err' : ''}`} value={destination}
              placeholder="Сочи" onChange={e => setDestination(e.target.value)} />
            {errors.destination && <div className="err-msg">{errors.destination}</div>}
          </div>
        </div>
        <div className="row">
          <div className="form-row">
            <label className="lbl">Дата и время вылета *</label>
            <input className={`ctl${errors.departureTime ? ' err' : ''}`} type="datetime-local"
              value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
            {errors.departureTime && <div className="err-msg">{errors.departureTime}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Дата и время прилёта *</label>
            <input className={`ctl${errors.arrivalTime ? ' err' : ''}`} type="datetime-local"
              value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
            {errors.arrivalTime && <div className="err-msg">{errors.arrivalTime}</div>}
          </div>
        </div>
        <div className="form-row">
          <label className="lbl">Гейт</label>
          <select className="ctl" value={gateId} onChange={e => setGateId(e.target.value)}>
            <option value="">— Не назначен —</option>
            {gates.map(g => <option key={g.id} value={g.id}>{g.name} (Терминал {g.terminal})</option>)}
          </select>
        </div>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn" type="button" onClick={() => navigate(isEdit ? `/flights/${id}` : '/flights')}>Отмена</button>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Frame>
  )
}

