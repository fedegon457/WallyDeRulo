import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Transacciones } from './pages/Transacciones'
import { Categorias } from './pages/Categorias'
import { MetodosPago } from './pages/MetodosPago'
import { Compartidos } from './pages/Compartidos'
import { Reportes } from './pages/Reportes'
import { GastosFijos } from './pages/GastosFijos'
import { Cuentas } from './pages/Cuentas'
import { Tarjetas } from './pages/Tarjetas'
import { Calculadora } from './pages/Calculadora'
import { Presupuestos } from './pages/Presupuestos'
import { MiCuenta } from './pages/MiCuenta'
import { Privacidad } from './pages/Privacidad'
import { Terminos } from './pages/Terminos'
import { Metas } from './pages/Metas'
import { Deudas } from './pages/Deudas'
import { Proyeccion } from './pages/Proyeccion'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transacciones" element={<Transacciones />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/metodos-pago" element={<MetodosPago />} />
        <Route path="/cuentas" element={<Cuentas />} />
        <Route path="/compartidos" element={<Compartidos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/gastos-fijos" element={<GastosFijos />} />
        <Route path="/tarjetas" element={<Tarjetas />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/deudas" element={<Deudas />} />
        <Route path="/proyeccion" element={<Proyeccion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
