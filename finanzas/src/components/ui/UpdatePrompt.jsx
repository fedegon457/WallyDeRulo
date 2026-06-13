import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Nueva versión disponible</p>
        <p className="text-xs text-gray-500">Actualizá para tener las últimas mejoras</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition"
      >
        Actualizar
      </button>
    </div>
  )
}
