import { useState, useEffect } from 'react'
import { usersApi } from '../api/users'
import type { User, Role } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const EMPTY_FORM = { username: '', email: '', password: '', role: 'DISPATCHER' as Role }

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<User | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function reload() {
    setLoading(true)
    usersApi.list().then(setUsers).catch(err => showToast(err.message, 'err')).finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  async function changeRole(u: User, role: Role) {
    try {
      const updated = await usersApi.changeRole(u.id, role)
      setUsers(us => us.map(x => x.id === updated.id ? updated : x))
      showToast('Роль изменена')
    } catch (err: any) {
      showToast(err.message, 'err')
    }
  }

  async function handleDelete() {
    if (!deleteModal) return
    setSaving(true)
    try {
      await usersApi.delete(deleteModal.id)
      showToast('Пользователь удалён')
      setDeleteModal(null)
      reload()
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setSaving(false)
    }
  }

  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!form.username.trim()) e.username = 'Обязательное поле'
    else if (form.username.trim().length < 3 || form.username.trim().length > 12) e.username = 'От 3 до 12 символов'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) e.username = 'Только латинские буквы, цифры и _'
    if (!form.email.trim()) e.email = 'Обязательное поле'
    else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) e.email = 'Некорректный email'
    if (!form.password) e.password = 'Обязательное поле'
    else if (form.password.length < 8) e.password = 'Минимум 8 символов'
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) e.password = 'Должен содержать буквы и цифры'
    return e
  }

  async function handleCreate() {
    setFormError('')
    const e = validateForm()
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    try {
      await usersApi.create({ ...form, username: form.username.trim(), email: form.email.trim() })
      showToast('Пользователь создан')
      setCreateModal(false)
      setForm(EMPTY_FORM)
      reload()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function fmtDate(dt: string) {
    return new Date(dt).toLocaleDateString('ru-RU')
  }

  return (
    <Frame>
      <h1 className="page-title">Пользователи</h1>

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn primary" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setFormError(''); setCreateModal(true) }}>
          + Добавить пользователя
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Регистрация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="num">{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  {u.id === currentUser?.id ? (
                    <span>{u.role}</span>
                  ) : (
                    <select className="ctl" value={u.role} style={{ minWidth: 120 }}
                      onChange={e => changeRole(u, e.target.value as Role)}>
                      <option value="DISPATCHER">DISPATCHER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  )}
                </td>
                <td>{fmtDate(u.createdAt)}</td>
                <td className="actions">
                  {u.id !== currentUser?.id && (
                    <button className="btn small danger" onClick={() => setDeleteModal(u)}>🗑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {createModal && (
        <Modal title="Добавить пользователя" onClose={() => setCreateModal(false)}
          footer={
            <>
              <button className="btn" onClick={() => setCreateModal(false)}>Отмена</button>
              <button className="btn primary" onClick={handleCreate} disabled={saving}>Создать</button>
            </>
          }>
          <div className="form-row">
            <label className="lbl">Имя пользователя *</label>
            <input className={`ctl${formErrors.username ? ' err' : ''}`} value={form.username}
              placeholder="ivan_disp" onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            {formErrors.username && <div className="err-msg">{formErrors.username}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Email *</label>
            <input className={`ctl${formErrors.email ? ' err' : ''}`} value={form.email}
              placeholder="ivan@airport.com" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {formErrors.email && <div className="err-msg">{formErrors.email}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Пароль *</label>
            <input className={`ctl${formErrors.password ? ' err' : ''}`} type="password" value={form.password}
              placeholder="минимум 8 символов" onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            {formErrors.password && <div className="err-msg">{formErrors.password}</div>}
          </div>
          <div className="form-row">
            <label className="lbl">Роль</label>
            <select className="ctl" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
              <option value="DISPATCHER">DISPATCHER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {formError && <div className="err-msg">{formError}</div>}
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Удалить пользователя" onClose={() => setDeleteModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDeleteModal(null)}>Отмена</button>
              <button className="btn primary danger" onClick={handleDelete} disabled={saving}>Удалить</button>
            </>
          }>
          <p>Удалить пользователя <strong>{deleteModal.username}</strong>?</p>
        </Modal>
      )}
    </Frame>
  )
}
