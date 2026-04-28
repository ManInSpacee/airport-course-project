import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('DISPATCHER')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function validate(): string | null {
    if (!username.trim() || !email.trim() || !password) return 'Заполните все поля'
    if (username.trim().length < 3) return 'Имя пользователя — минимум 3 символа'
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Имя пользователя: только буквы, цифры и _'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Введите корректный email'
    if (password.length < 6) return 'Пароль — минимум 6 символов'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.register(username.trim(), email.trim(), password, role)
      login(token, user)
      navigate('/flights')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Регистрация</h1>
        <div className="sub">Создать аккаунт в АэроПорт</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="lbl">Имя пользователя</label>
            <input className="ctl" value={username} placeholder="ivan_disp"
              onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="form-row">
            <label className="lbl">Email</label>
            <input className="ctl" type="email" value={email} placeholder="ivan@airport.com"
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="lbl">Пароль</label>
            <input className="ctl" type="password" value={password} placeholder="минимум 6 символов"
              onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="lbl">Роль</label>
            <select className="ctl" value={role} onChange={e => setRole(e.target.value)}>
              <option value="DISPATCHER">DISPATCHER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          {error && <div className="err-msg">{error}</div>}
          <div className="form-row" style={{ marginTop: 14 }}>
            <button className="btn primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
          <div style={{ fontSize: 12, textAlign: 'center' }}>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
