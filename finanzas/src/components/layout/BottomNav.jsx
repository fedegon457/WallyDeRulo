import { NavLink } from 'react-router-dom'
import { ArrowUpDown, BarChart2, Users, Wallet, RefreshCw } from 'lucide-react'

const tabs = [
  { to: '/gastos-fijos',  icon: RefreshCw,   label: 'Fijos'     },
  { to: '/compartidos',   icon: Users,       label: 'Amigos'    },
  { to: '/transacciones', icon: ArrowUpDown, label: 'Trans.'    },
  { to: '/cuentas',       icon: Wallet,      label: 'Cuentas'   },
  { to: '/reportes',      icon: BarChart2,   label: 'Reportes'  },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="bg-white" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
