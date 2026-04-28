import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="topbar">
      <span className="brand">Aerolive</span>
      <span className="spacer" />
      {user && (
        <>
          <span className="user">{user.username} · {user.role}</span>
          <button className="btn small" onClick={handleLogout}>Выйти</button>
        </>
      )}
    </div>
  )
}
