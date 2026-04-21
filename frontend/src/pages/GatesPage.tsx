import { useState, useEffect } from 'react'
import { gatesApi } from '../api/gates'
import type { Gate } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function GatesPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()

  const [gates, setGates] = useState<Gate[]>([])
  const [loading, setLoading] = useState(true)
  const [formModal, setFormModal] = useState<Gate | 'new' | null>(null)
  const [deleteModal, setDeleteModal] = useState<Gate | null>(null)
  const [name, setName] = useState('')
  const [terminal, setTerminal] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function reload() {
    setLoading(true)
    gatesApi.list().then(setGates).catch(err => showToast(err.message, 'err')).finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  function openNew() {
    setName(''); setTerminal(''); setErrors({})
    setFormModal('new')
  }

  function openEdit(g: Gate) {
    setName(g.name); setTerminal(g.terminal); setErrors({})
    setFormModal(g)
  }

  async function handleSave() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Обязательное поле'
    if (!terminal.trim()) e.terminal = 'Обязательное поле'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      if (formModal === 'new') {
        await gatesApi.create({ name: name.trim(), terminal: terminal.trim() })
        showToast('Гейт добавлен')
      } else {
        await gatesApi.update((formModal as Gate).id, { name: name.trim(), terminal: terminal.trim() })
        showToast('Гейт обновлён')
      }
      setFormModal(null)
      reload()
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal) return
    setSaving(true)
    try {
      await gatesApi.delete(deleteModal.id)
      showToast('Гейт удалён')
      setDeleteModal(null)
      reload()
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Frame>
      <h1 className="page-title">Гейты</h1>

      {isAdmin && (
        <div className="toolbar">
          <div className="spacer" />
          <button className="btn primary" onClick={openNew}>+ Добавить гейт</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : gates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Гейтов не найдено</div>
          <div className="empty-sub">Добавьте первый гейт</div>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Терминал</th>
              <th>Рейсов</th>
              {isAdmin && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {gates.map(g => (
              <tr key={g.id}>
                <td className="num">{g.id}</td>
                <td>{g.name}</td>
                <td>{g.terminal}</td>
                <td className="num">{g._count?.flights ?? 0}</td>
                {isAdmin && (
                  <td className="actions">
                    <button className="btn small" onClick={() => openEdit(g)}>✏️</button>
                    <button className="btn small danger" onClick={() => setDeleteModal(g)}>🗑</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formModal !== null && (
        <Modal
          title={formModal === 'new' ? 'Добавить гейт' : 'Редактировать гейт'}
          onClose={() => setFormModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setFormModal(null)}>Отмена</button>
              <button className="btn primary" onClick={handleSave} disabled={saving}>Сохранить</button>
            </>
          }>
          <div className="form-row">
            <label className="lbl">Название *</label>
            <input className={`ctl${errors.name ? ' err' : ''}`} value={name}
              placeholder="A1" onChange={e => setName(e.target.value)} />
            {errors.name && <div className="err-msg">{errors.name}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Терминал *</label>
            <input className={`ctl${errors.terminal ? ' err' : ''}`} value={terminal}
              placeholder="A" onChange={e => setTerminal(e.target.value)} />
            {errors.terminal && <div className="err-msg">{errors.terminal}</div>}
          </div>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Удалить гейт" onClose={() => setDeleteModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDeleteModal(null)}>Отмена</button>
              <button className="btn primary danger" onClick={handleDelete} disabled={saving}>Удалить</button>
            </>
          }>
          <p>Удалить гейт <strong>{deleteModal.name}</strong> (Терминал {deleteModal.terminal})?</p>
        </Modal>
      )}
    </Frame>
  )
}
