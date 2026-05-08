import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowUpDown, Tag, CreditCard,
  Users, BarChart2, LogOut, X, DollarSign, RefreshCw, Wallet, Calculator, Target
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// Full nav for desktop sidebar
const desktopNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacciones', icon: ArrowUpDown, label: 'Transacciones' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
  { to: '/cuentas', icon: Wallet, label: 'Cuentas' },
  { to: '/tarjetas', icon: CreditCard, label: 'Tarjetas' },
  { to: '/compartidos', icon: Users, label: 'Gastos compartidos' },
  { to: '/gastos-fijos', icon: RefreshCw, label: 'Gastos Fijos' },
  { to: '/presupuestos', icon: Target, label: 'Presupuestos' },
  { to: '/reportes', icon: BarChart2, label: 'Reportes' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
]

// Compact options for mobile sheet (bottom nav already has the main sections)
const mobileNav = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/tarjetas', icon: CreditCard, label: 'Tarjetas' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
]

export function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()

  return (
    <>
      {/* ── Desktop sidebar (always visible on lg+) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-full flex-shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">WallyDeRulo</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {desktopNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom sheet ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white w-full rounded-t-2xl shadow-2xl pb-safe">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign size={15} className="text-white" />
                </div>
                <span className="font-bold text-gray-900">WallyDeRulo</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-3">
              {mobileNav.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}

              <div className="mt-1 pt-2 border-t border-gray-100">
                <button
                  onClick={() => { signOut(); onClose() }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
