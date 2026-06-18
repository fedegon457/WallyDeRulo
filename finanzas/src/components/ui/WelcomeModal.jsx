import { IconSparkles, IconMap } from '@tabler/icons-react'
import { ChromeBar } from './ChromeBar'

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
      <div className="relative bg-paper rounded-2xl border-[2.5px] border-ink shadow-brutal w-full max-w-sm overflow-hidden">

        <ChromeBar title="bienvenido" color="#FFB500" />

        <div className="bg-ink px-6 pt-6 pb-6 text-center">
          <div className="w-14 h-14 bg-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gold/30">
            <IconSparkles size={26} className="text-gold" />
          </div>
          <h1 className="text-2xl font-black text-gold tracking-tight font-display">¡Bienvenido a MyWalli!</h1>
          <p className="text-gold/60 text-sm mt-1 font-mono text-[11px] tracking-[1px]">Tu asistente de finanzas personales</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {PREVIEW_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FFF8E0] border border-ink/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
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
            className="w-full bg-gold text-ink border-2 border-ink font-black rounded-xl py-3 flex items-center justify-center gap-2 shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition"
          >
            <IconMap size={16} />
            Ver guía de primeros pasos
          </button>
          <button
            onClick={onDismiss}
            className="w-full bg-white text-ink border-2 border-ink font-bold rounded-xl py-2.5 hover:bg-[#FFF8E0] transition text-sm"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
