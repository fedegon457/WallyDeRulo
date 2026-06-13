import { NavLink } from 'react-router-dom'
import {
  IconLayoutDashboard, IconArrowsUpDown, IconCreditCard, IconWallet, IconChartBar
} from '@tabler/icons-react'

const tabs = [
  { to: '/',              icon: IconLayoutDashboard, label: 'Inicio'    },
  { to: '/transacciones', icon: IconArrowsUpDown,    label: 'Trans.'    },
  { to: '/tarjetas',      icon: IconCreditCard,      label: 'Tarjetas'  },
  { to: '/cuentas',       icon: IconWallet,          label: 'Cuentas'   },
  { to: '/reportes',      icon: IconChartBar,        label: 'Reportes'  },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-gray-100">
      <div className="flex items-center h-16 px-1">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex items-center justify-center"
          >
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isActive ? 'bg-accent border border-accent/80' : ''}`}
              >
                <Icon
                  size={18}
                  stroke={isActive ? 2.3 : 1.8}
                  className={isActive ? 'text-gray-900' : 'text-gray-400'}
                />
                <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
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
