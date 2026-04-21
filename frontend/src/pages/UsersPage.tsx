import { useState, useEffect } from 'react'
import { usersApi } from '../api/users'
import type { User, Role } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<User | null>(null)
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

  function fmtDate(dt: string) {
    return new Date(dt).toLocaleDateString('ru-RU')
  }

  return (
    <Frame>
      <h1 className="page-title">Пользователи</h1>

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
