import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { QuickAddModal } from '../ui/QuickAdd'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar renders inside the flex row; mobile sheet renders as a portal overlay */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900">WallyDeRulo</span>
          {/* Placeholder para centrar el título */}
          <div className="w-9" />
        </header>

        {/* Contenido — con padding abajo en mobile para no tapar con el BottomNav */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* FAB (visible en mobile y desktop) */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="lg:flex fixed bottom-24 right-5 z-40 w-13 h-13 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center lg:bottom-6 lg:right-6 lg:w-14 lg:h-14"
        style={{ width: 52, height: 52 }}
        title="Registrar transacción rápida"
      >
        <Plus size={22} />
      </button>

      {/* Bottom nav mobile */}
      <BottomNav />

      {/* Modal compartido */}
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  )
}
