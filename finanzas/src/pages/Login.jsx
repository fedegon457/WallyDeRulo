import { useState } from 'react'
import { IconSparkles, IconArrowRight } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const { signIn, signUp, loginDemo } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
      } else {
        const { error } = await signUp(email, password)
        if (error) setError(error.message)
        else setSuccess('Cuenta creada. Revisá tu email para confirmar.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Panel izquierdo / top: brand ─────────────────────────────── */}
      <div
        className="lg:w-5/12 flex flex-col justify-between px-10 py-12 relative overflow-hidden"
        style={{ backgroundColor: '#00C4B4', minHeight: '44vh' }}
      >
        {/* Formas decorativas sólidas */}
        <div
          className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border-[6px] border-white/20"
          style={{ backgroundColor: '#00A99D' }}
        />
        <div
          className="absolute top-20 -right-6 w-24 h-24 rounded-2xl border-4 border-white/20 rotate-12"
          style={{ backgroundColor: '#009688' }}
        />
        <div
          className="absolute bottom-24 left-8 w-8 h-8 rounded-full border-4 border-white/30"
          style={{ backgroundColor: '#FCCB30' }}
        />
        <div className="absolute top-10 right-20 w-3 h-3 rounded-full bg-white/40" />
        <div className="absolute bottom-10 right-32 w-5 h-5 rounded-full bg-white/20" />

        {/* Logo */}
        <div className="relative z-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-white/30"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', transform: 'rotate(-3deg)' }}
          >
            <IconSparkles size={26} className="text-white" stroke={2} />
          </div>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-4">MyWalli</p>
        </div>

        {/* Headline */}
        <div className="relative z-10 my-8 lg:my-0">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-none tracking-tight">
            Tu plata,
          </h1>
          <h1
            className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
            style={{ color: '#FCCB30' }}
          >
            en orden.
          </h1>
          <p className="text-white/60 text-sm mt-4 font-semibold max-w-xs">
            Finanzas personales sin complicaciones
          </p>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10 hidden lg:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-8 h-2 rounded-full bg-white/70" />
        </div>
      </div>

      {/* ── Panel derecho / bottom: form ─────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0"
        style={{ backgroundColor: '#F2FAFA' }}
      >
        <div className="w-full max-w-sm">

          {/* Card del form */}
          <div className="bg-white rounded-2xl border-2 border-gray-900 overflow-hidden"
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.15)' }}>

            {/* Tab switcher */}
            <div className="flex border-b-2 border-gray-900">
              <button
                onClick={() => setMode('login')}
                className="flex-1 py-3.5 text-sm font-bold transition-all border-r-2 border-gray-900"
                style={mode === 'login'
                  ? { backgroundColor: '#FCCB30', color: '#111' }
                  : { backgroundColor: 'white', color: '#9ca3af' }
                }
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setMode('register')}
                className="flex-1 py-3.5 text-sm font-bold transition-all"
                style={mode === 'register'
                  ? { backgroundColor: '#FCCB30', color: '#111' }
                  : { backgroundColor: 'white', color: '#9ca3af' }
                }
              >
                Registrarse
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  {mode === 'login' ? '¡Hola de nuevo!' : '¡Empecemos!'}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {mode === 'login'
                    ? 'Ingresá tus datos para continuar'
                    : 'Creá tu cuenta gratis'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
                <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-medium">
                    {success}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm border-2 border-gray-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#00C4B4', color: 'white', boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}
                >
                  {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  {!loading && <IconArrowRight size={16} stroke={2.5} />}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 font-bold">o</span>
                </div>
              </div>

              <button
                type="button"
                onClick={loginDemo}
                className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
              >
                Ver demo con datos de ejemplo
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 font-medium mt-4">
            Tus datos, siempre privados y seguros.
          </p>
        </div>
      </div>

    </div>
  )
}
