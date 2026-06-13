import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { IconMenu2, IconPlus } from '@tabler/icons-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { QuickAddModal } from '../ui/QuickAdd'
import { Onboarding } from '../ui/Onboarding'
import { UpdatePrompt } from '../ui/UpdatePrompt'

const ONBOARDING_KEY = 'mywalli_onboarded_v1'

export function Layout() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [quickAddOpen,   setQuickAddOpen]   = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY))

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b-2 border-gray-100 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-primary-50 text-gray-500 transition-colors"
          >
            <IconMenu2 size={20} />
          </button>
          <span className="font-extrabold text-primary-500 tracking-tight text-lg">MyWalli</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-24 right-5 z-40 w-[52px] h-[52px] rounded-2xl bg-accent shadow-accent hover:shadow-xl active:scale-95 transition-all flex items-center justify-center lg:bottom-6 lg:right-6 border-2 border-gray-900"
        title="Registrar transacción rápida"
      >
        <IconPlus size={22} className="text-gray-900" stroke={2.5} />
      </button>

      <BottomNav />
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      {showOnboarding && <Onboarding onFinish={finishOnboarding} />}
      <UpdatePrompt />
    </div>
  )
}

