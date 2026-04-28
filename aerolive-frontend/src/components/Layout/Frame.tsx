import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="screen">
      <TopBar />
      <div className="body">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
      <div className="footer-bar">
        <span>Aerolive — Управление рейсами</span>
      </div>
    </div>
  )
}
