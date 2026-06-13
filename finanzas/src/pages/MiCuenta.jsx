import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  IconUser, IconShield, IconFileText, IconHeadset,
  IconTrash, IconAlertTriangle, IconX, IconDownload,
  IconSun, IconMoon, IconEraser, IconBell, IconBellOff
} from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  getNotificationStatus, subscribeToNotifications, unsubscribeFromNotifications, isSubscribed
} from '../lib/notifications'
import { format } from 'date-fns'
import { fmt } from '../lib/fmt'

async function exportAllData(userId) {
  const { data: txs } = await supabase
    .from('transactions')
    .select('id, type, amount, date, notes, transfer_group_id, categories(name, parent_id), payment_methods(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (!txs?.length) return

  const { data: cats } = await supabase.from('categories').select('id, name, parent_id').eq('user_id', userId)

  const headers = ['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Importe', 'Nota']
  const rows = txs.map(t => {
    const cat = t.categories
    const parentCat = cat?.parent_id ? cats?.find(c => c.id === cat.parent_id) : null
    const catName = parentCat ? `${parentCat.name} > ${cat?.name}` : (cat?.name ?? '')
    const type = t.transfer_group_id ? 'Transferencia' : t.type === 'income' ? 'Ingreso' : 'Egreso'
    return [t.date, type, catName, t.payment_methods?.name ?? '', t.amount, t.notes ?? '']
  })

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `mywalli_export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function MiCuenta() {
  const { user, signOut } = useAuth()
  const { dark, toggle }  = useTheme()
  const demo = isDemo(user)

  const [modal,        setModal]        = useState(null)
  const [confirmText,  setConfirmText]  = useState('')
  const [working,      setWorking]      = useState(false)
  const [error,        setError]        = useState('')
  const [exporting,    setExporting]    = useState(false)
  const [notifStatus,  setNotifStatus]  = useState('default')  // 'unsupported'|'default'|'granted'|'denied'
  const [subscribed,   setSubscribed]   = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  useEffect(() => {
    getNotificationStatus().then(setNotifStatus)
    if (!demo) isSubscribed(user?.id).then(setSubscribed)
  }, [user, demo])

  const handleNotifToggle = async () => {
    if (notifLoading) return
    setNotifLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromNotifications(user.id)
        setSubscribed(false)
      } else {
        await subscribeToNotifications(user.id)
        setSubscribed(true)
        setNotifStatus('granted')
      }
    } catch (err) {
      if (err.message === 'permission_denied') setNotifStatus('denied')
    } finally {
      setNotifLoading(false)
    }
  }

  const closeModal = () => { setModal(null); setConfirmText(''); setError('') }

  const handleExport = async () => {
    setExporting(true)
    try { await exportAllData(user.id) } finally { setExporting(false) }
  }

  const handleClearHistory = async () => {
    if (confirmText !== 'BORRAR') return
    setWorking(true); setError('')
    try {
      await supabase.rpc('clear_user_history')
      closeModal()
      alert('Historial eliminado. Tus categorías y cuentas se mantienen.')
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    } finally { setWorking(false) }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'ELIMINAR') return
    setWorking(true); setError('')
    try {
      await supabase.rpc('delete_user_account')
      await signOut()
    } catch {
      setError('Ocurrió un error al eliminar la cuenta. Contactanos.')
      setWorking(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
        <p className="text-sm text-gray-500">Información y configuración</p>
      </div>

      {/* Info de usuario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cuenta</p>
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconUser size={20} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {demo ? 'demo@mywalli.com.ar' : user?.email}
            </p>
          </div>
          {demo && (
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Demo
            </span>
          )}
        </div>
      </div>

      {/* Apariencia */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Apariencia</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {dark ? <IconMoon size={18} className="text-gray-500" /> : <IconSun size={18} className="text-gray-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{dark ? 'Modo oscuro' : 'Modo claro'}</p>
              <p className="text-xs text-gray-400">Cambiá el tema de la app</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${dark ? 'bg-primary-500' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-6' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      {!demo && notifStatus !== 'unsupported' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notificaciones</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                {subscribed
                  ? <IconBell size={18} className="text-primary-500" />
                  : <IconBellOff size={18} className="text-gray-400" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {subscribed ? 'Notificaciones activas' : 'Notificaciones desactivadas'}
                </p>
                <p className="text-xs text-gray-400">
                  {notifStatus === 'denied'
                    ? 'Bloqueadas en el navegador — habilitá desde ajustes'
                    : 'Gastos fijos, cierres de tarjeta y presupuestos'}
                </p>
              </div>
            </div>
            {notifStatus === 'denied' ? (
              <span className="text-xs text-red-400 font-medium">Bloqueadas</span>
            ) : (
              <button
                onClick={handleNotifToggle}
                disabled={notifLoading}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${subscribed ? 'bg-primary-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${subscribed ? 'translate-x-6' : ''}`}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Links legales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Legal y soporte</p>
        </div>
        <Link to="/privacidad"
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconShield size={18} className="text-blue-500" />
          </div>
          <span className="text-sm font-medium text-gray-800 flex-1">Política de Privacidad</span>
          <span className="text-gray-300 text-xs">›</span>
        </Link>
        <Link to="/terminos"
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconFileText size={18} className="text-purple-500" />
          </div>
          <span className="text-sm font-medium text-gray-800 flex-1">Términos de Uso</span>
          <span className="text-gray-300 text-xs">›</span>
        </Link>
        <a href="mailto:fefe1carini@gmail.com"
          className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition">
          <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconHeadset size={18} className="text-teal-500" />
          </div>
          <span className="text-sm font-medium text-gray-800 flex-1">Soporte</span>
          <span className="text-gray-400 text-xs">fefe1carini@gmail.com</span>
        </a>
      </div>

      {/* Zona de peligro */}
      {!demo && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-50 flex items-center justify-between">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Zona de peligro</p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 transition disabled:opacity-50"
            >
              <IconDownload size={14} />
              {exporting ? 'Exportando...' : 'Exportar datos'}
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-500">
              Estas acciones son irreversibles. Exportá tus datos antes de continuar.
            </p>

            {/* Opción 1: Solo historial */}
            <button
              onClick={() => setModal('history')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-200 hover:bg-amber-50 transition text-left"
            >
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconEraser size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700">Borrar historial</p>
                <p className="text-xs text-gray-400">Elimina transacciones, presupuestos, metas y deudas. Conserva categorías y cuentas.</p>
              </div>
            </button>

            {/* Opción 2: Eliminar cuenta */}
            <button
              onClick={() => setModal('account')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-red-200 hover:bg-red-50 transition text-left"
            >
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconTrash size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-600">Eliminar cuenta</p>
                <p className="text-xs text-gray-400">Borra absolutamente todo, incluyendo el acceso a la app.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Borrar historial */}
      {modal === 'history' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconEraser size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Borrar historial</h2>
                  <p className="text-xs text-amber-500">Tus categorías y cuentas se conservan</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <IconX size={18} />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 space-y-1">
              <p className="font-semibold">Se eliminará permanentemente:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-amber-600">
                <li>Todas tus transacciones</li>
                <li>Gastos fijos y presupuestos</li>
                <li>Metas de ahorro y deudas</li>
                <li>Gastos compartidos</li>
              </ul>
              <p className="font-semibold text-green-600 mt-2">Se conservará: categorías, cuentas y tu acceso a la app.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribí <span className="font-mono font-bold text-amber-600">BORRAR</span> para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="BORRAR"
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-mono focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleClearHistory}
                disabled={confirmText !== 'BORRAR' || working}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {working ? 'Borrando...' : 'Borrar historial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar cuenta */}
      {modal === 'account' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconAlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Eliminar cuenta</h2>
                  <p className="text-xs text-red-500">Esta acción es irreversible</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <IconX size={18} />
              </button>
            </div>

            <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold">Se borrarán permanentemente:</p>
              <ul className="list-disc ml-4 space-y-0.5 text-red-600">
                <li>Todas tus transacciones</li>
                <li>Categorías y métodos de pago</li>
                <li>Gastos fijos y presupuestos</li>
                <li>Metas, deudas y gastos compartidos</li>
                <li>Tu cuenta de acceso</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribí <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoFocus
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-mono focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="button" onClick={handleDeleteAccount}
                disabled={confirmText !== 'ELIMINAR' || working}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {working ? 'Eliminando...' : 'Eliminar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
