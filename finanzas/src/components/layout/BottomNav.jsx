import { NavLink } from 'react-router-dom'
import {
  IconLayoutDashboard, IconArrowsUpDown, IconCreditCard, IconWallet, IconChartBar
} from '@tabler/icons-react'

const tabs = [
  { to: '/',              icon: IconLayoutDashboard, label: 'Inicio',   color: '#4ab8b8' },
  { to: '/transacciones', icon: IconArrowsUpDown,    label: 'Trans.',   color: '#3b5bdb' },
  { to: '/tarjetas',      icon: IconCreditCard,      label: 'Tarjetas', color: '#c92a2a' },
  { to: '/cuentas',       icon: IconWallet,          label: 'Cuentas',  color: '#2f9e44' },
  { to: '/reportes',      icon: IconChartBar,        label: 'Reportes', color: '#be185d' },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-gray-100">
      <div className="flex items-center h-16 px-1">
        {tabs.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex items-center justify-center"
          >
            {({ isActive }) => (
              <div
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
                style={isActive ? { background: `${color}18` } : {}}
              >
                {/* GGA exception: per-tab accent color from static data array */}
                <Icon
                  size={18}
                  stroke={isActive ? 2.3 : 1.8}
                  style={{ color: isActive ? color : undefined }}
                  className={isActive ? '' : 'text-gray-400'}
                />
                <span
                  className={`text-[10px] font-bold leading-none`}
                  style={{ color: isActive ? color : undefined }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
      <div className="bg-white safe-area-bottom" />
    </nav>
  )
}
