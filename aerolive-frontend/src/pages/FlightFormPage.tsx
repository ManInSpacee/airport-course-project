import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { flightsApi } from '../api/flights'
import { gatesApi } from '../api/gates'
import type { Gate } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { useToast } from '../context/ToastContext'
import { AIRLINES, HOME_AIRPORT } from '../data/airlines'

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const DESTINATIONS = [
  'Санкт-Петербург (LED)',
  'Сочи (AER)',
  'Екатеринбург (SVX)',
  'Новосибирск (OVB)',
  'Казань (KZN)',
  'Калининград (KGD)',
  'Уфа (UFA)',
  'Краснодар (KRR)',
  'Ростов-на-Дону (ROV)',
  'Минеральные Воды (MRV)',
  'Анталья (AYT)',
  'Дубай (DXB)',
  'Стамбул (IST)',
  'Пекин (PEK)',
  'Бангкок (BKK)',
]

export function FlightFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { t } = useTranslation()

  const [gates, setGates] = useState<Gate[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [flightNumber, setFlightNumber] = useState('')
  const [origin, setOrigin] = useState(HOME_AIRPORT)
  const [destination, setDestination] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [gateId, setGateId] = useState('')
  const [airlineCode, setAirlineCode] = useState('')
  const [aircraftModel, setAircraftModel] = useState('')
  const [aircraftRegistration, setAircraftRegistration] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const selectedAirline = AIRLINES.find(a => a.code === airlineCode)

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
          setAirlineCode(f.airlineCode ?? '')
          setAircraftModel(f.aircraftModel ?? '')
          setAircraftRegistration(f.aircraftRegistration ?? '')
        })
        .catch(err => showToast(err.message, 'err'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, showToast])

  // Когда меняем авиакомпанию — сбрасываем самолёт
  function handleAirlineChange(code: string) {
    setAirlineCode(code)
    setAircraftModel('')
    const airline = AIRLINES.find(a => a.code === code)
    // Автозаполнение номера рейса префиксом
    if (code && !flightNumber) {
      setFlightNumber(code + '-')
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    const maxYear = new Date().getFullYear() + 1

    if (!flightNumber.trim()) {
      e.flightNumber = t('flights.required')
    } else if (!/^[A-Z0-9]{1,3}-\d{1,4}$/.test(flightNumber.trim())) {
      e.flightNumber = 'Формат: SU-101, U6-205'
    }

    if (!origin.trim()) e.origin = t('flights.required')
    if (!destination.trim()) e.destination = t('flights.required')

    if (origin.trim() && destination.trim() && origin.trim() === destination.trim())
      e.destination = 'Откуда и куда не могут совпадать'

    // Один из маршрутов обязан быть нашим аэропортом
    if (origin.trim() && destination.trim() &&
        origin.trim() !== HOME_AIRPORT && destination.trim() !== HOME_AIRPORT) {
      e.origin = `Один из пунктов маршрута должен быть ${HOME_AIRPORT}`
    }

    if (!departureTime) e.departureTime = t('flights.required')
    else if (new Date(departureTime).getFullYear() > maxYear) e.departureTime = `Год не может быть позднее ${maxYear}`

    if (!arrivalTime) e.arrivalTime = t('flights.required')
    else if (new Date(arrivalTime).getFullYear() > maxYear) e.arrivalTime = `Год не может быть позднее ${maxYear}`

    if (departureTime && arrivalTime && arrivalTime <= departureTime)
      e.arrivalTime = 'Время прилёта должно быть позже вылета'

    if (!airlineCode) e.airlineCode = t('flights.required')
    if (!aircraftModel) e.aircraftModel = t('flights.required')

    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const airline = AIRLINES.find(a => a.code === airlineCode)
    const data = {
      flightNumber: flightNumber.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: new Date(departureTime).toISOString(),
      arrivalTime: new Date(arrivalTime).toISOString(),
      gateId: gateId ? Number(gateId) : null,
      airlineName: airline?.name ?? null,
      airlineCode: airlineCode || null,
      aircraftModel: aircraftModel || null,
      aircraftRegistration: aircraftRegistration.trim() || null,
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
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Frame><div className="loading">{t('common.loading')}</div></Frame>

  return (
    <Frame>
      <div className="breadcrumb">
        <button className="btn link" onClick={() => navigate(isEdit ? `/flights/${id}` : '/flights')}>← {t('common.back')}</button>
      </div>
      <h1 className="page-title">{isEdit ? t('flights.editFlight') : t('flights.newFlight')}</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>

        {/* Авиакомпания */}
        <h3 style={{ marginBottom: 8 }}>{t('flights.airline')}</h3>
        <div className="row">
          <div className="form-row">
            <label className="lbl">{t('flights.airline')} *</label>
            <select className={`ctl${errors.airlineCode ? ' err' : ''}`}
              value={airlineCode} onChange={e => handleAirlineChange(e.target.value)}>
              <option value="">— Выберите авиакомпанию —</option>
              {AIRLINES.map(a => (
                <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
              ))}
            </select>
            {errors.airlineCode && <div className="err-msg">{errors.airlineCode}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">{t('flights.number')} *</label>
            <input className={`ctl${errors.flightNumber ? ' err' : ''}`} value={flightNumber}
              placeholder="SU-100" onChange={e => setFlightNumber(e.target.value.toUpperCase())} />
            {errors.flightNumber && <div className="err-msg">{errors.flightNumber}</div>}
          </div>
        </div>

        {/* Воздушное судно */}
        <h3 style={{ marginTop: 16, marginBottom: 8 }}>{t('flights.aircraft')}</h3>
        <div className="row">
          <div className="form-row">
            <label className="lbl">{t('flights.aircraftModel')} *</label>
            <select className={`ctl${errors.aircraftModel ? ' err' : ''}`}
              value={aircraftModel} onChange={e => setAircraftModel(e.target.value)}
              disabled={!airlineCode}>
              <option value="">— Выберите модель —</option>
              {(selectedAirline?.aircraft ?? []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.aircraftModel && <div className="err-msg">{errors.aircraftModel}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">{t('flights.aircraftRegistration')}</label>
            <input className="ctl" value={aircraftRegistration}
              placeholder="RA-73770" onChange={e => setAircraftRegistration(e.target.value.toUpperCase())} />
          </div>
        </div>

        {/* Маршрут */}
        <h3 style={{ marginTop: 16, marginBottom: 4 }}>Маршрут</h3>
        <div className="hint" style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Один из пунктов маршрута — всегда {HOME_AIRPORT}
        </div>
        <div className="row">
          <div className="form-row">
            <label className="lbl">{t('flights.origin')} *</label>
            <select className={`ctl${errors.origin ? ' err' : ''}`}
              value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value={HOME_AIRPORT}>{HOME_AIRPORT}</option>
              {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.origin && <div className="err-msg">{errors.origin}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">{t('flights.destination')} *</label>
            <select className={`ctl${errors.destination ? ' err' : ''}`}
              value={destination} onChange={e => setDestination(e.target.value)}>
              <option value="">— Выберите —</option>
              {[HOME_AIRPORT, ...DESTINATIONS]
                .filter(d => d !== origin)
                .map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.destination && <div className="err-msg">{errors.destination}</div>}
          </div>
        </div>

        {/* Времена */}
        <div className="row" style={{ marginTop: 8 }}>
          <div className="form-row">
            <label className="lbl">{t('flights.departureLabel')} *</label>
            <input className={`ctl${errors.departureTime ? ' err' : ''}`} type="datetime-local"
              value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
            {errors.departureTime && <div className="err-msg">{errors.departureTime}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">{t('flights.arrivalLabel')} *</label>
            <input className={`ctl${errors.arrivalTime ? ' err' : ''}`} type="datetime-local"
              value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
            {errors.arrivalTime && <div className="err-msg">{errors.arrivalTime}</div>}
          </div>
        </div>

        {/* Гейт */}
        <div className="form-row" style={{ marginTop: 8 }}>
          <label className="lbl">{t('flights.gate')}</label>
          <select className="ctl" value={gateId} onChange={e => setGateId(e.target.value)}>
            <option value="">{t('flights.notAssigned')}</option>
            {gates.map(g => <option key={g.id} value={g.id}>{g.name} (Терминал {g.terminal})</option>)}
          </select>
        </div>

        {formError && <div className="err-msg" style={{ marginBottom: 8 }}>{formError}</div>}
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn" type="button"
            onClick={() => navigate(isEdit ? `/flights/${id}` : '/flights')}>{t('common.cancel')}</button>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </Frame>
  )
}
