import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('en') ? 'en' : 'ru'

  function toggle() {
    i18n.changeLanguage(current === 'ru' ? 'en' : 'ru')
  }

  return (
    <button className="btn small lang-switch" onClick={toggle} title="Language / Язык">
      {current === 'ru' ? 'RU' : 'EN'}
    </button>
  )
}
