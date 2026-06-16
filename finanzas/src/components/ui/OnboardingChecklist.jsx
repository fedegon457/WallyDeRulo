import { Link } from 'react-router-dom'
import { IconCheck, IconArrowRight, IconX, IconMap } from '@tabler/icons-react'

const STEPS = [
  {
    id: 'account',
    emoji: '🏦',
    title: 'Creá tu primera cuenta',
    desc: 'Banco, efectivo o billetera virtual',
    to: '/cuentas',
  },
  {
    id: 'transaction',
    emoji: '💸',
    title: 'Registrá un gasto o ingreso',
    desc: 'Tu primera transacción',
    to: '/transacciones',
  },
  {
    id: 'recurring',
    emoji: '🔁',
    title: 'Configurá un gasto fijo',
    desc: 'Suscripción, alquiler, servicio...',
    to: '/gastos-fijos',
  },
  {
    id: 'budget',
    emoji: '📊',
    title: 'Armá tu primer presupuesto',
    desc: 'Controlá gastos por categoría',
    to: '/presupuestos',
  },
]

export function OnboardingChecklist({ completed, onDismiss }) {
  const doneCount = STEPS.filter(s => completed[s.id]).length
  const allDone = doneCount === STEPS.length

  return (
    <div className="bg-white rounded-2xl border-2 border-primary-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconMap size={16} className="text-primary-500" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-sm">Primeros pasos</h2>
            <p className="text-xs text-gray-400 font-medium">{doneCount} de {STEPS.length} completados</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition flex-shrink-0"
          title="Cerrar guía"
        >
          <IconX size={15} />
        </button>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className="h-2 rounded-full transition-all duration-500 bg-accent ring-1 ring-black/10"
          style={/* GGA exception: dynamic percentage width requires inline style */ { width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {STEPS.map(step => {
          const done = completed[step.id]
          const Inner = (
            <>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base transition-all border ${
                  done ? 'bg-accent border-yellow-500' : 'bg-gray-100 border-transparent'
                }`}
              >
                {done
                  ? <IconCheck size={15} className="text-gray-900" strokeWidth={3} />
                  : step.emoji
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
              </div>
              {!done && <IconArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
            </>
          )

          return done ? (
            <div key={step.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-60">
              {Inner}
            </div>
          ) : (
            <Link
              key={step.id}
              to={step.to}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary-50 transition-colors"
            >
              {Inner}
            </Link>
          )
        })}
      </div>

      {allDone && (
        <div className="mt-4 bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
          <p className="text-sm font-extrabold text-primary-700">¡Todo listo! Ya sos un pro de MyWalli 🎉</p>
          <button onClick={onDismiss} className="text-xs text-primary-500 hover:underline mt-1 font-semibold">
            Cerrar esta guía
          </button>
        </div>
      )}
    </div>
  )
}
