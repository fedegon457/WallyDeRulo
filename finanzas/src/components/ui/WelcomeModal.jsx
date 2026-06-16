import { IconSparkles, IconArrowRight, IconMap } from '@tabler/icons-react'

const PREVIEW_STEPS = [
  { emoji: '🏦', title: 'Registrá tus cuentas', desc: 'Efectivo, banco, billetera virtual...' },
  { emoji: '💸', title: 'Anotá tus gastos e ingresos', desc: 'Categorizados y en segundos' },
  { emoji: '🔁', title: 'Automatizá gastos fijos', desc: 'Suscripciones, alquiler, servicios' },
  { emoji: '📊', title: 'Controlá con presupuestos', desc: 'Sabé cuánto te queda por categoría' },
]

export function WelcomeModal({ onStartTour, onDismiss }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl border-2 border-gray-100 shadow-2xl w-full max-w-sm overflow-hidden">

        <div className="bg-primary-500 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
            <IconSparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">¡Bienvenido a MyWalli!</h1>
          <p className="text-white/70 text-sm mt-1 font-medium">Tu asistente de finanzas personales</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {PREVIEW_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                {step.emoji}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={onStartTour}
            className="w-full bg-accent text-yellow-950 border-2 border-yellow-950 font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-yellow-300 transition active:scale-95"
          >
            <IconMap size={16} />
            Ver guía de primeros pasos
          </button>
          <button
            onClick={onDismiss}
            className="w-full bg-white text-gray-500 font-bold rounded-xl py-2.5 border-2 border-gray-200 hover:bg-gray-50 transition text-sm"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
