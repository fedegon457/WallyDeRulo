import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, Calendar, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoRecurringExpenses, demoCategories, demoPaymentMethods } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const FREQ_LABELS = { monthly: 'Mensual', yearly: 'Anual', weekly: 'Semanal' }

function RecurringForm({ initial, categories, paymentMethods, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'monthly')
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(initial?.payment_method_id ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [saving, setSaving] = useState(false)

  const expenseCategories = categories.filter(c => !c.parent_id && c.type === 'expense')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      amount: parseFloat(amount),
      frequency,
      day_of_month: dayOfMonth ? parseInt(dayOfMonth) : null,
      category_id: categoryId || null,
      payment_method_id: paymentMethodId || null,
      notes,
      icon: icon || null,
      is_active: true,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-[56px_1fr] gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ícono</label>
          <input
            type="text"
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="🏋️"
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={2}
          />
        </div>
        <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required placeholder="Netflix, Gym, Spotify..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Monto ($)" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0" />
        <Select label="Frecuencia" value={frequency} onChange={e => setFrequency(e.target.value)}>
          <option value="monthly">Mensual</option>
          <option value="weekly">Semanal</option>
          <option value="yearly">Anual</option>
        </Select>
      </div>

      {frequency === 'monthly' && (
        <Input
          label="Día del mes (vencimiento)"
          type="number"
          min="1"
          max="31"
          value={dayOfMonth}
          onChange={e => setDayOfMonth(e.target.value)}
          placeholder="ej: 15"
        />
      )}

      <Select label="Categoría" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        <option value="">— Sin categoría —</option>
        {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </Select>

      <Select label="Método de pago" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)}>
        <option value="">— Sin especificar —</option>
        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </Select>

      <Textarea label="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descripción o detalle..." rows={2} />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

function PayModal({ expense, onPay, onCancel }) {
  const [amount, setAmount] = useState(expense.amount)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onPay({ amount: parseFloat(amount), date, notes })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{expense.icon || '📋'}</span>
        <div>
          <p className="font-semibold text-gray-900">{expense.name}</p>
          <p className="text-sm text-gray-500">{fmt(expense.amount)} · {FREQ_LABELS[expense.frequency]}</p>
        </div>
      </div>

      <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <Input label="Importe ($)" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
      <Input label="Nota" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Comprobante, referencia..." />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Registrando...' : 'Registrar pago'}</Button>
      </div>
    </form>
  )
}

export function GastosFijos() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [payments, setPayments] = useState([])
  const [modal, setModal] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPeriod] = useState(format(new Date(), 'yyyy-MM'))

  const load = async () => {
    if (isDemo(user)) {
      setExpenses(demoRecurringExpenses)
      setCategories(demoCategories)
      setPaymentMethods(demoPaymentMethods)
      setPayments([])
      setLoading(false)
      return
    }
    const [expRes, catRes, pmRes, payRes] = await Promise.all([
      supabase.from('recurring_expenses').select('*, categories(id, name, icon), payment_methods(id, name)').eq('user_id', user.id).eq('is_active', true).order('name'),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name'),
      supabase.from('recurring_expense_payments').select('*').eq('user_id', user.id).eq('period', currentPeriod),
    ])
    setExpenses(expRes.data ?? [])
    setCategories(catRes.data ?? [])
    setPaymentMethods(pmRes.data ?? [])
    setPayments(payRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (isDemo(user)) { setModal(null); return }
    if (modal?.id) {
      await supabase.from('recurring_expenses').update(values).eq('id', modal.id)
    } else {
      await supabase.from('recurring_expenses').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este gasto fijo?')) return
    if (isDemo(user)) { setExpenses(prev => prev.filter(e => e.id !== id)); return }
    await supabase.from('recurring_expenses').update({ is_active: false }).eq('id', id)
    load()
  }

  const handlePay = async ({ amount, date, notes }) => {
    const expense = payModal
    if (isDemo(user)) {
      setPayments(prev => [...prev, { id: `dp-${Date.now()}`, recurring_expense_id: expense.id, amount, date, period: currentPeriod, notes }])
      setPayModal(null)
      return
    }
    // Create transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'expense',
      amount,
      date,
      category_id: expense.category_id || null,
      payment_method_id: expense.payment_method_id || null,
      notes: notes || expense.name,
    })
    // Register payment
    await supabase.from('recurring_expense_payments').insert({
      user_id: user.id,
      recurring_expense_id: expense.id,
      amount,
      date,
      period: currentPeriod,
      notes,
    })
    setPayModal(null)
    load()
  }

  const isPaid = (expenseId) => payments.some(p => p.recurring_expense_id === expenseId)
  const getPaid = (expenseId) => payments.filter(p => p.recurring_expense_id === expenseId).reduce((s, p) => s + p.amount, 0)

  const totalMonthly = expenses.filter(e => e.frequency === 'monthly').reduce((s, e) => s + e.amount, 0)
  const totalPaid = expenses.reduce((s, e) => s + getPaid(e.id), 0)
  const totalPending = expenses.filter(e => !isPaid(e.id)).reduce((s, e) => s + e.amount, 0)

  const mes = format(new Date(), 'MMMM yyyy', { locale: es })

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Fijos</h1>
          <p className="text-gray-500 text-sm capitalize">{mes}</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400">Total mensual</p>
          <p className="font-bold text-base text-gray-900">{fmt(totalMonthly)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400">Pagado</p>
          <p className="font-bold text-base text-emerald-600">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400">Pendiente</p>
          <p className="font-bold text-base text-orange-500">{fmt(totalPending)}</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin gastos fijos configurados</p>
          <button onClick={() => setModal({})} className="text-blue-600 text-sm mt-2 hover:underline">Agregar uno</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {expenses.map(e => {
              const paid = isPaid(e.id)
              const paidAmount = getPaid(e.id)
              const cat = categories.find(c => c.id === e.category_id)
              const pm = paymentMethods.find(m => m.id === e.payment_method_id)
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${paid ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    {e.icon || cat?.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                    <p className="text-xs text-gray-400">
                      {FREQ_LABELS[e.frequency]}
                      {e.day_of_month ? ` · día ${e.day_of_month}` : ''}
                      {cat ? ` · ${cat.name}` : ''}
                      {pm ? ` · ${pm.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(e.amount)}</p>
                      {paid && paidAmount !== e.amount && (
                        <p className="text-xs text-emerald-600">Pagado {fmt(paidAmount)}</p>
                      )}
                    </div>
                    {paid ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                        <Check size={13} /> Pagado
                      </span>
                    ) : (
                      <button
                        onClick={() => setPayModal(e)}
                        className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap"
                      >
                        Pagar
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => setModal(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-blue-600 transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(e.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
        {modal && (
          <RecurringForm
            initial={modal?.id ? modal : null}
            categories={categories}
            paymentMethods={paymentMethods}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Registrar pago">
        {payModal && (
          <PayModal
            expense={payModal}
            onPay={handlePay}
            onCancel={() => setPayModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
