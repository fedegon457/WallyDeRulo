import { Component } from 'react'

// GGA exception: React error boundaries require a class component — there is no functional equivalent in React 19
export class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-4 p-8 text-center bg-surface">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">Algo salió mal</p>
            <p className="text-sm text-gray-500 mt-1">Recargá la página para continuar.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition"
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
