import { useState, useEffect, useCallback } from 'react'
import { auditApi, type AuditFilters } from '../api/audit'
import { usersApi } from '../api/users'
import type { AuditLog, User, ActionType } from '../api/types'
import { Frame } from '../components/Layout/Frame'
import { useToast } from '../context/ToastContext'

const ACTION_COLORS: Record<ActionType, string> = {
  CREATE: 'var(--ok)',
  UPDATE: 'var(--accent)',
  DELETE: 'var(--err)',
  STATUS_CHANGE: 'var(--warn)',
  ROLE_CHANGE: '#7c3aed',
}

export function AuditPage() {
  const { showToast } = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AuditFilters>({ limit: 25 })

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      setLogs(await auditApi.list(filters))
    } catch (err: any) {
      showToast(err.message, 'err')
    } finally {
      setLoading(false)
    }
  }, [filters, showToast])

  useEffect(() => { loadLogs() }, [loadLogs])
  useEffect(() => { usersApi.list().then(setUsers).catch(() => {}) }, [])

  function fmt(dt: string) {
    return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Frame>
      <h1 className="page-title">Журнал действий</h1>

      <div className="toolbar">
        <div>
          <label className="lbl">Тип объекта</label>
          <select className="ctl" value={filters.entity_type || ''} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value || undefined }))}>
            <option value="">Все</option>
            <option value="Flight">Рейс</option>
            <option value="Gate">Гейт</option>
            <option value="User">Пользователь</option>
          </select>
        </div>
        <div>
          <label className="lbl">Пользователь</label>
          <select className="ctl" value={filters.user_id || ''} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value || undefined }))}>
            <option value="">Все</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl">Записей</label>
          <select className="ctl" value={filters.limit} onChange={e => setFilters(f => ({ ...f, limit: Number(e.target.value) }))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Записей не найдено</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Объект</th>
                <th>ID</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="num">{fmt(log.createdAt)}</td>
                  <td>{log.user.username}</td>
                  <td>
                    <span style={{ color: ACTION_COLORS[log.action], fontWeight: 600 }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityType}</td>
                  <td className="num">{log.entityId}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 300 }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Frame>
  )
}
