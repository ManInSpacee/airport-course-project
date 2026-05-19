import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../LanguageSwitcher'

export function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="topbar">
      <span className="brand">Aerolive</span>
      <span className="spacer" />
      <LanguageSwitcher />
      {user && (
        <>
          <span className="user">{user.username} · {user.role}</span>
          <button className="btn small" onClick={handleLogout}>{t('nav.logout')}</button>
        </>
      )}
    </div>
  )
}
