import { NavLink, Link } from 'react-router-dom'
import {
  IconLayoutDashboard, IconArrowsUpDown, IconTag, IconCreditCard,
  IconUsers, IconChartBar, IconLogout, IconX, IconRefresh, IconWallet,
  IconCalculator, IconTarget, IconUserCircle, IconPigMoney, IconScale,
  IconSun, IconMoon, IconTrendingUp
} from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const desktopNav = [
  { to: '/',              icon: IconLayoutDashboard, label: 'Dashboard',          color: '#4ab8b8' },
  { to: '/transacciones', icon: IconArrowsUpDown,    label: 'Transacciones',      color: '#3b5bdb' },
  { to: '/categorias',    icon: IconTag,             label: 'Categorias',         color: '#e67700' },
  { to: '/cuentas',       icon: IconWallet,          label: 'Cuentas',            color: '#2f9e44' },
  { to: '/tarjetas',      icon: IconCreditCard,      label: 'Tarjetas',           color: '#c92a2a' },
  { to: '/compartidos',   icon: IconUsers,           label: 'Gastos compartidos', color: '#7b1fa2' },
  { to: '/gastos-fijos',  icon: IconRefresh,         label: 'Gastos Fijos',       color: '#7c3aed' },
  { to: '/presupuestos',  icon: IconTarget,          label: 'Presupuestos',       color: '#1864ab' },
  { to: '/metas',         icon: IconPigMoney,        label: 'Metas de ahorro',    color: '#5c7cfa' },
  { to: '/deudas',        icon: IconScale,           label: 'Deudas',             color: '#b45309' },
  { to: '/proyeccion',    icon: IconTrendingUp,      label: 'Proyección',         color: '#0d9488' },
  { to: '/reportes',      icon: IconChartBar,        label: 'Reportes',           color: '#be185d' },
  { to: '/calculadora',   icon: IconCalculator,      label: 'Calculadora',        color: '#475569' },
]

const mobileNav = [
  { to: '/categorias',   icon: IconTag,          label: 'Categorias',         color: '#e67700' },
  { to: '/compartidos',  icon: IconUsers,        label: 'Gastos compartidos', color: '#7b1fa2' },
  { to: '/gastos-fijos', icon: IconRefresh,      label: 'Gastos Fijos',       color: '#7c3aed' },
  { to: '/presupuestos', icon: IconTarget,       label: 'Presupuestos',       color: '#1864ab' },
  { to: '/metas',        icon: IconPigMoney,     label: 'Metas de ahorro',    color: '#5c7cfa' },
  { to: '/deudas',       icon: IconScale,        label: 'Deudas',             color: '#b45309' },
  { to: '/proyeccion',   icon: IconTrendingUp,   label: 'Proyección',         color: '#0d9488' },
  { to: '/calculadora',  icon: IconCalculator,   label: 'Calculadora',        color: '#475569' },
  { to: '/mi-cuenta',    icon: IconUserCircle,   label: 'Mi cuenta',          color: '#6b7280' },
]

export function Sidebar({ open, onClose }) {
  const { signOut } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-500 h-full flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-300">
          <div className="w-9 h-9 bg-primary-200/60 rounded-2xl flex items-center justify-center flex-shrink-0">
            <IconWallet size={18} className="text-primary-800" stroke={2} />
          </div>
          <span className="font-extrabold text-primary-800 text-lg tracking-tight">MyWalli</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {desktopNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-primary-800 hover:bg-primary-400/30 hover:text-primary-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border ${isActive ? 'bg-accent border-accent/80' : 'border-transparent'}`}
                  >
                    <Icon size={16} className={isActive ? 'text-gray-900' : 'text-primary-700'} stroke={2} />
                  </div>
                  <span className="flex-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-primary-300 space-y-0.5">
          <NavLink
            to="/mi-cuenta"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-primary-700 hover:bg-primary-400/30 hover:text-primary-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border ${isActive ? 'bg-accent border-accent/80' : 'border-transparent'}`}>
                  <IconUserCircle size={16} className={isActive ? 'text-gray-900' : 'text-primary-700'} stroke={2} />
                </div>
                <span className="flex-1">Mi cuenta</span>
              </>
            )}
          </NavLink>
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-primary-700 hover:bg-primary-400/30 hover:text-primary-900 transition-all w-full"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center border border-primary-300">
              {dark ? <IconSun size={15} stroke={2} /> : <IconMoon size={15} stroke={2} />}
            </div>
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-primary-700 hover:bg-red-500/20 hover:text-red-700 transition-all w-full"
          >
            <div className="w-7 h-7 rounded-xl flex items-center justify-center">
              <IconLogout size={16} stroke={2} />
            </div>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">

            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-2 border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary-500 rounded-2xl flex items-center justify-center">
                  <IconWallet size={16} className="text-primary-800" stroke={2} />
                </div>
                <span className="font-extrabold text-gray-900 tracking-tight text-lg">MyWalli</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                <IconX size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1 pb-2">
                Mas secciones
              </p>
              {mobileNav.map(({ to, icon: Icon, label, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                      isActive ? 'text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* GGA exception: per-nav-item color from static array */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: `${color}${isActive ? '22' : '15'}` }}
                      >
                        <Icon size={16} stroke={isActive ? 2.5 : 2} style={{ color }} />
                      </div>
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 border-t-2 border-gray-100 space-y-1">
              <div className="flex gap-3 px-3 py-1">
                <Link to="/privacidad" onClick={onClose} className="text-xs text-gray-400 hover:text-primary-600 transition">Privacidad</Link>
                <span className="text-gray-200">·</span>
                <Link to="/terminos" onClick={onClose} className="text-xs text-gray-400 hover:text-primary-600 transition">Términos</Link>
              </div>
              <button
                onClick={() => { toggle(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all w-full"
              >
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {dark ? <IconSun size={16} className="text-gray-500" stroke={2} /> : <IconMoon size={16} className="text-gray-500" stroke={2} />}
                </div>
                {dark ? 'Modo claro' : 'Modo oscuro'}
              </button>
              <button
                onClick={() => { signOut(); onClose() }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all w-full"
              >
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <IconLogout size={16} className="text-red-400" stroke={2} />
                </div>
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
