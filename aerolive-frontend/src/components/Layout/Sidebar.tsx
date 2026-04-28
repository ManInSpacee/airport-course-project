import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Sidebar() {
  const { isAdmin } = useAuth()

  return (
    <div className="sidebar">
      <nav className="nav">
        <NavLink to="/flights" className={({ isActive }) => isActive ? 'active' : ''}>Рейсы</NavLink>
        <NavLink to="/gates" className={({ isActive }) => isActive ? 'active' : ''}>Гейты</NavLink>
        {isAdmin && (
          <>
            <div className="section">Администрирование</div>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>Пользователи</NavLink>
            <NavLink to="/audit" className={({ isActive }) => isActive ? 'active' : ''}>Журнал аудита</NavLink>
          </>
        )}
      </nav>
    </div>
  )
}
