import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Заполните все поля')
    setLoading(true)
    try {
      const { token, user } = await authApi.login(email, password)
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
        <h1>АэроПорт</h1>
        <div className="sub">Система управления рейсами</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="lbl">Email</label>
            <input className={`ctl${error ? ' err' : ''}`} type="email" value={email}
              onChange={e => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-row">
            <label className="lbl">Пароль</label>
            <input className={`ctl${error ? ' err' : ''}`} type="password" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="err-msg">{error}</div>}
          <div className="form-row" style={{ marginTop: 14 }}>
            <button className="btn primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
          <div style={{ fontSize: 12, textAlign: 'center' }}>
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
