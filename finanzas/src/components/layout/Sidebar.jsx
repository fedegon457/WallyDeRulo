import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowUpDown, Tag, CreditCard,
  Users, BarChart2, LogOut, X, DollarSign, RefreshCw, Wallet
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacciones', icon: ArrowUpDown, label: 'Transacciones' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
  { to: '/cuentas', icon: Wallet, label: 'Cuentas' },
  { to: '/compartidos', icon: Users, label: 'Gastos compartidos' },
  { to: '/gastos-fijos', icon: RefreshCw, label: 'Gastos Fijos' },
  { to: '/reportes', icon: BarChart2, label: 'Reportes' },
]

export function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">WallyDeRulo</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
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
    </>
  )
}
