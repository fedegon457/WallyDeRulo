import { useState, useEffect } from 'react'
import { X, ChevronRight, ArrowLeftRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth, isDemo } from '../../contexts/AuthContext'
import { demoCategories, demoPaymentMethods } from '../../lib/demoData'
import { Button } from './Button'
import { CategorySheet } from './CategorySheet'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function FormRow({ label, onClick, children }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center min-h-[52px] border-b border-gray-100 last:border-0 gap-4 ${onClick ? 'cursor-pointer active:bg-gray-50 -mx-5 px-5' : ''}`}
    >
      <span className="text-sm text-gray-400 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>
    </div>
  )
}

export function QuickAddModal({ open, onClose }) {
  const { user } = useAuth()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    if (isDemo(user)) { setCategories(demoCategories); setPaymentMethods(demoPaymentMethods); return }
    Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name'),
    ]).then(([{ data: cats }, { data: pms }]) => {
      setCategories(cats ?? [])
      setPaymentMethods(pms ?? [])
    })
  }, [user])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const reset = () => {
    setAmount('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setCategoryId('')
    setPaymentMethodId('')
    setFromAccountId('')
    setToAccountId('')
    setNotes('')
    setType('expense')
    setSaved(false)
  }

  const filteredCategories = categories.filter(c => c.type === type || !c.parent_id && c.type === type || c.parent_id)
    // keep all categories but filter top-level by type; subcats pass through
    // actually: show only top-level of current type + their children
  const topCats = categories.filter(c => !c.parent_id && c.type === type)
  const allSubcats = categories.filter(c => c.parent_id && topCats.some(p => p.id === c.parent_id))
  const visibleCategories = [...topCats, ...allSubcats]

  const selectedCat = categories.find(c => c.id === categoryId)
  const selectedParent = selectedCat?.parent_id ? categories.find(c => c.id === selectedCat.parent_id) : null
  const selectedPM = paymentMethods.find(m => m.id === paymentMethodId)

  const formatDate = (d) => format(new Date(d + 'T12:00:00'), "EEE d/M/yyyy", { locale: es })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount) return
    setSaving(true)
    if (!isDemo(user)) {
      if (type === 'transfer') {
        const groupId = crypto.randomUUID()
        const fromName = paymentMethods.find(m => m.id === fromAccountId)?.name ?? ''
        const toName   = paymentMethods.find(m => m.id === toAccountId)?.name ?? ''
        await supabase.from('transactions').insert([
          { user_id: user.id, type: 'expense', amount: parseFloat(amount), date, payment_method_id: fromAccountId || null, transfer_group_id: groupId, notes: notes || `Transferencia → ${toName}` },
          { user_id: user.id, type: 'income',  amount: parseFloat(amount), date, payment_method_id: toAccountId || null,   transfer_group_id: groupId, notes: notes || `Transferencia desde ${fromName}` },
        ])
      } else {
        await supabase.from('transactions').insert({
          user_id: user.id, type, amount: parseFloat(amount), date,
          category_id: categoryId || null,
          payment_method_id: paymentMethodId || null,
          notes,
        })
      }
    }
    setSaving(false)
    setSaved(true)
  }

  const handleClose = () => { reset(); onClose() }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">

          {/* Header con toggle tipo */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Nueva transacción</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              <button type="button" onClick={() => { setType('expense'); setCategoryId('') }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>
                Egreso
              </button>
              <button type="button" onClick={() => { setType('income'); setCategoryId('') }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>
                Ingreso
              </button>
              <button type="button" onClick={() => { setType('transfer'); setCategoryId('') }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${type === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                Transf.
              </button>
            </div>
          </div>

          {saved ? (
            <div className="px-5 pb-8 pt-2 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">✓</div>
              <p className="text-emerald-700 font-semibold">¡Guardado!</p>
              <Button variant="secondary" onClick={handleClose} className="w-full">Cerrar</Button>
              <button onClick={reset} className="text-sm text-blue-600 hover:underline">Agregar otro</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-5 pb-2">
                {/* Fecha */}
                <FormRow label="Fecha">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="text-sm text-gray-900 bg-transparent border-none outline-none w-full"
                  />
                </FormRow>

                {/* Importe */}
                <FormRow label="Importe">
                  <span className="text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="flex-1 text-sm text-gray-900 bg-transparent border-none outline-none"
                  />
                </FormRow>

                {type === 'transfer' ? (
                  <>
                    <FormRow label="De" onClick={() => setFromOpen(true)}>
                      {paymentMethods.find(m => m.id === fromAccountId)
                        ? <span className="text-sm text-gray-900">{paymentMethods.find(m => m.id === fromAccountId).name}</span>
                        : <span className="text-sm text-gray-300">Cuenta origen</span>}
                      <ChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
                    </FormRow>
                    <FormRow label="A" onClick={() => setToOpen(true)}>
                      {paymentMethods.find(m => m.id === toAccountId)
                        ? <span className="text-sm text-gray-900">{paymentMethods.find(m => m.id === toAccountId).name}</span>
                        : <span className="text-sm text-gray-300">Cuenta destino</span>}
                      <ChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
                    </FormRow>
                  </>
                ) : (
                  <>
                    <FormRow label="Categoría" onClick={() => setCatOpen(true)}>
                      {selectedCat ? (
                        <span className="text-sm text-gray-900">{selectedCat.icon} {selectedParent ? `${selectedParent.name} › ` : ''}{selectedCat.name}</span>
                      ) : <span className="text-sm text-gray-300">Sin categoría</span>}
                      <ChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
                    </FormRow>
                    <FormRow label="Cuenta" onClick={() => setAccountOpen(true)}>
                      {selectedPM ? <span className="text-sm text-gray-900">{selectedPM.name}</span> : <span className="text-sm text-gray-300">Sin especificar</span>}
                      <ChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
                    </FormRow>
                  </>
                )}

                {/* Nota */}
                <FormRow label="Nota">
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Descripción..."
                    className="flex-1 text-sm text-gray-900 bg-transparent border-none outline-none"
                  />
                </FormRow>
              </div>

              <div className="px-5 pb-6 pt-3">
                <Button type="submit" className="w-full" size="lg" disabled={saving || !amount}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Category sheet */}
      {catOpen && (
        <CategorySheet
          categories={visibleCategories}
          value={categoryId}
          onChange={setCategoryId}
          onClose={() => setCatOpen(false)}
        />
      )}

      {/* From / To sheets para transferencias */}
      {fromOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFromOpen(false)} />
          <div className="relative bg-white w-full rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Cuenta origen</h3>
              <button onClick={() => setFromOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-3">
              {paymentMethods.map(m => (
                <button key={m.id} type="button" onClick={() => { setFromAccountId(m.id); setFromOpen(false) }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${fromAccountId === m.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {toOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setToOpen(false)} />
          <div className="relative bg-white w-full rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Cuenta destino</h3>
              <button onClick={() => setToOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-3">
              {paymentMethods.map(m => (
                <button key={m.id} type="button" onClick={() => { setToAccountId(m.id); setToOpen(false) }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${toAccountId === m.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account sheet */}
      {accountOpen && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAccountOpen(false)} />
          <div className="relative bg-white w-full rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Cuenta</h3>
              <button onClick={() => setAccountOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              <button
                type="button"
                onClick={() => { setPaymentMethodId(''); setAccountOpen(false) }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${!paymentMethodId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Sin especificar
              </button>
              {paymentMethods.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setPaymentMethodId(m.id); setAccountOpen(false) }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${paymentMethodId === m.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
