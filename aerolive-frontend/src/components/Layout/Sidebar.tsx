import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export function Sidebar() {
  const { isAdmin } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="sidebar">
      <nav className="nav">
        <NavLink to="/flights" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.flights')}</NavLink>
        <NavLink to="/gates" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.gates')}</NavLink>
        {isAdmin && (
          <>
            <div className="section">{t('nav.audit')}</div>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.users')}</NavLink>
            <NavLink to="/audit" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.audit')}</NavLink>
          </>
        )}
      </nav>
    </div>
  )
}
