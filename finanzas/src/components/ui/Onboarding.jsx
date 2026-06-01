import { useState } from 'react'
import {
  IconWallet, IconArrowsUpDown, IconTarget, IconPigMoney,
  IconArrowRight, IconCheck,
} from '@tabler/icons-react'

const SCREENS = [
  {
    Icon:  IconWallet,
    color: '#00C4B4',
    title: 'Bienvenido a MyWalli',
    sub:   'Tus finanzas personales, ordenadas',
    desc:  'Registrá ingresos, gastos y transferencias en segundos. Todo tu dinero en un solo lugar.',
  },
  {
    Icon:  IconArrowsUpDown,
    color: '#3B82F6',
    title: 'Controlá cada movimiento',
    sub:   'Transacciones y categorías',
    desc:  'Organizá tus gastos con categorías propias. Filtrá por mes, tipo y método de pago.',
  },
  {
    Icon:  IconTarget,
    color: '#F59E0B',
    title: 'Presupuestos inteligentes',
    sub:   'Sabé cuándo estás gastando de más',
    desc:  'Asigná límites mensuales por categoría y seguí cuánto te queda disponible.',
  },
  {
    Icon:  IconPigMoney,
    color: '#22C55E',
    title: 'Metas de ahorro',
    sub:   'Alcanzá tus objetivos financieros',
    desc:  'Creá metas, seguí tu progreso y celebrá cada logro en el camino.',
  },
]

export function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0)
  const screen = SCREENS[step]
  const { Icon, color } = screen
  const isLast = step === SCREENS.length - 1

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-6 pt-6">
        <button
          onClick={onFinish}
          className="text-sm text-gray-400 hover:text-gray-600 transition px-2 py-1"
        >
          Saltar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-lg"
          style={{ backgroundColor: color + '18' }}
        >
          <Icon size={56} style={{ color }} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">{screen.title}</h1>
        <p className="text-sm font-semibold text-gray-400 mb-4">{screen.sub}</p>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{screen.desc}</p>
      </div>

      {/* Footer */}
      <div className="px-8 pb-10 space-y-5 max-w-sm mx-auto w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {SCREENS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:           i === step ? 24 : 8,
                height:          8,
                backgroundColor: i === step ? color : '#E5E7EB',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => isLast ? onFinish() : setStep(s => s + 1)}
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
          style={{ backgroundColor: color }}
        >
          {isLast
            ? <><IconCheck size={20} strokeWidth={2.5} /> Comenzar</>
            : <>Siguiente <IconArrowRight size={20} /></>
          }
        </button>
      </div>
    </div>
  )
}
