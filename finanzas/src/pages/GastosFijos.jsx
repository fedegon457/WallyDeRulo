import { useEffect, useState } from 'react'
import {
  IconPlus, IconPencil, IconTrash, IconCheck, IconRefresh, IconX, IconSearch, IconChevronDown
} from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import {
  demoRecurringExpenses, demoCategories, demoPaymentMethods, demoREAdd,
} from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmojiPicker, IconDisplay } from '../components/ui/EmojiPicker'
import { CustomSelect, buildPmGroups, ACCOUNT_TYPE_LABELS } from '../components/ui/CustomSelect'
import { CategorySheet } from '../components/ui/CategorySheet'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const FREQ_LABELS = { monthly: 'Mensual', yearly: 'Anual', weekly: 'Semanal' }

// ─── Picker de categorías ─────────────────────────────────────────────────────
function CategoryPickerModal({ categories, existingExpenses, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase()

  const usedCatIds = new Set(existingExpenses.map(e => e.category_id).filter(Boolean))
  const available = categories.filter(c =>
    c.type === 'expense' &&
    !usedCatIds.has(c.id) &&
    (!q || c.name.toLowerCase().includes(q))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Agregar gasto fijo</h2>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <IconX size={18} />
            </button>
          </div>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoría..."
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {available.length > 0 ? (
            available.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect({ name: c.name, icon: c.icon || null, category_id: c.id })}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition text-left border-2 border-transparent hover:border-primary-100"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {c.icon
                    ? <IconDisplay icon={c.icon} size={20} />
                    : <span className="text-base">📋</span>
                  }
                </div>
                <span className="font-medium text-gray-800 text-sm">{c.name}</span>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              {q ? `Sin resultados para "${search}"` : 'Todas tus categorías ya tienen un gasto fijo asignado'}
            </p>
          )}

          <button
            type="button"
            onClick={() => onSelect(null)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center gap-2 transition mt-2"
          >
            <IconPlus size={15} /> Crear sin categoría
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── Formulario de configuración ──────────────────────────────────────────────
function RecurringForm({ initial, categories, paymentMethods, onSave, onCancel }) {
  const [name, setName]                   = useState(initial?.name ?? '')
  const [amount, setAmount]               = useState(initial?.amount ?? '')
  const [frequency, setFrequency]         = useState(initial?.frequency ?? 'monthly')
  const [dayOfMonth, setDayOfMonth]       = useState(initial?.day_of_month ?? '')
  const [categoryId, setCategoryId]       = useState(initial?.category_id ?? '')
  const [paymentMethodId, setPayMethodId] = useState(initial?.payment_method_id ?? '')
  const [notes, setNotes]                 = useState(initial?.notes ?? '')
  const [icon, setIcon]                   = useState(initial?.icon ?? '')
  const [saving, setSaving]               = useState(false)
  const [catOpen, setCatOpen]             = useState(false)

  const fromPicker = !!(initial?._new && initial?.category_id)
  const selectedCat = categories.find(c => c.id === categoryId)
  const selectedParentCat = selectedCat?.parent_id ? categories.find(c => c.id === selectedCat.parent_id) : null
  const expenseCategories = categories.filter(c => c.type === 'expense')

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
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Categoría seleccionada (viene del picker) */}
      {selectedCat && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-primary-50 rounded-xl border border-primary-100">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            {selectedCat.icon
              ? <IconDisplay icon={selectedCat.icon} size={16} />
              : <span className="text-sm">📋</span>
            }
          </div>
          <span className="text-sm font-medium text-primary-700">{selectedCat.name}</span>
          <span className="text-xs text-primary-400 ml-auto">Categoría</span>
        </div>
      )}

      {/* Ícono + Nombre */}
      <div className="flex gap-3 items-end">
        <EmojiPicker value={icon} onChange={setIcon} label="Ícono" compact />
        <div className="flex-1">
          <Input
            label="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Ej: Netflix, Gym..."
          />
        </div>
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm select-none">$</span>
          <AmountInput
            value={amount}
            onChange={setAmount}
            required
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Frecuencia — pill buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
        <div className="flex gap-2">
          {[['monthly','Mensual'], ['yearly','Anual'], ['weekly','Semanal']].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFrequency(val)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                frequency === val
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Día de vencimiento */}
      {frequency === 'monthly' && (
        <Input
          label="Día de vencimiento (opcional)"
          type="number" min="1" max="31"
          value={dayOfMonth}
          onChange={e => setDayOfMonth(e.target.value)}
          placeholder="ej: 15"
        />
      )}

      {/* Categoría — solo sin picker */}
      {!fromPicker && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 transition text-left"
          >
            {selectedCat ? (
              <>
                {selectedCat.icon && <IconDisplay icon={selectedCat.icon} size={16} className="flex-shrink-0" />}
                <span className="flex-1 text-gray-900">
                  {selectedParentCat ? `${selectedParentCat.name} › ` : ''}{selectedCat.name}
                </span>
                <button type="button" onClick={e => { e.stopPropagation(); setCategoryId('') }}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500">
                  <IconX size={13} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-gray-400">— Sin categoría —</span>
                <IconChevronDown size={15} className="text-gray-400 flex-shrink-0" />
              </>
            )}
          </button>
          {catOpen && (
            <CategorySheet
              categories={expenseCategories}
              value={categoryId}
              onChange={setCategoryId}
              onClose={() => setCatOpen(false)}
            />
          )}
        </div>
      )}

      {/* Método de pago */}
      <CustomSelect
        label="Método de pago"
        value={paymentMethodId}
        onChange={setPayMethodId}
        placeholder="— Sin especificar —"
        groups={buildPmGroups(paymentMethods)}
      />

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Descripción o detalle..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

// ─── Modal de pago ─────────────────────────────────────────────────────────────
function PayModal({ expense, onPay, onCancel }) {
  const [amount, setAmount] = useState(expense.amount)
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes]   = useState('')
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
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          {expense.icon
            ? <IconDisplay icon={expense.icon} size={28} />
            : <span className="text-2xl">📋</span>
          }
        </div>
        <div>
          <p className="font-semibold text-gray-900">{expense.name}</p>
          <p className="text-sm text-gray-500">{fmt(expense.amount)} · {FREQ_LABELS[expense.frequency]}</p>
        </div>
      </div>
      <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <AmountInput label="Importe ($)" value={amount} onChange={setAmount} required />
      <Input label="Nota" value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Comprobante, referencia..." />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? 'Registrando...' : 'Registrar pago'}
        </Button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function GastosFijos() {
  const { user } = useAuth()
  const [expenses, setExpenses]             = useState([])
  const [categories, setCategories]         = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [payments, setPayments]             = useState([])
  const [showPicker, setShowPicker]         = useState(false)
  const [modal, setModal]                   = useState(null) // null | expense (edit) | { _new: true, ...prefill }
  const [payModal, setPayModal]             = useState(null)
  const [loading, setLoading]               = useState(true)
  const [currentPeriod]                     = useState(format(new Date(), 'yyyy-MM'))

  const load = async () => {
    if (isDemo(user)) {
      setExpenses([...demoRecurringExpenses])
      setCategories(demoCategories)
      setPaymentMethods(demoPaymentMethods)
      setPayments([])
      setLoading(false)
      return
    }
    const [expRes, catRes, pmRes, payRes] = await Promise.all([
      supabase.from('recurring_expenses')
        .select('*, categories(id, name, icon), payment_methods(id, name)')
        .eq('user_id', user.id).eq('is_active', true).order('name'),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name'),
      supabase.from('recurring_expense_payments').select('*')
        .eq('user_id', user.id).eq('period', currentPeriod),
    ])
    setExpenses(expRes.data ?? [])
    setCategories(catRes.data ?? [])
    setPaymentMethods(pmRes.data ?? [])
    setPayments(payRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const handlePickerSelect = (prefill) => {
    setShowPicker(false)
    setModal({ _new: true, ...(prefill ?? {}) })
  }

  const save = async (values) => {
    if (isDemo(user)) {
      if (modal?.id) {
        const idx = demoRecurringExpenses.findIndex(e => e.id === modal.id)
        if (idx !== -1) Object.assign(demoRecurringExpenses[idx], values)
      } else {
        demoREAdd({ ...values, id: `re_${Date.now()}`, user_id: 'demo' })
      }
      setModal(null)
      setExpenses([...demoRecurringExpenses])
      return
    }
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
    if (isDemo(user)) {
      const idx = demoRecurringExpenses.findIndex(e => e.id === id)
      if (idx !== -1) demoRecurringExpenses.splice(idx, 1)
      setExpenses([...demoRecurringExpenses])
      return
    }
    await supabase.from('recurring_expenses').update({ is_active: false }).eq('id', id)
    load()
  }

  const handlePay = async ({ amount, date, notes }) => {
    const expense = payModal
    if (isDemo(user)) {
      setPayments(prev => [...prev, {
        id: `dp-${Date.now()}`,
        recurring_expense_id: expense.id, amount, date, period: currentPeriod, notes,
      }])
      setPayModal(null)
      return
    }
    await supabase.from('transactions').insert({
      user_id: user.id, type: 'expense', amount, date,
      category_id: expense.category_id || null,
      payment_method_id: expense.payment_method_id || null,
      notes: notes || expense.name,
    })
    await supabase.from('recurring_expense_payments').insert({
      user_id: user.id, recurring_expense_id: expense.id,
      amount, date, period: currentPeriod, notes,
    })
    setPayModal(null)
    load()
  }

  const isPaid  = (id) => payments.some(p => p.recurring_expense_id === id)
  const getPaid = (id) => payments.filter(p => p.recurring_expense_id === id).reduce((s, p) => s + p.amount, 0)

  const totalMonthly = expenses.filter(e => e.frequency === 'monthly').reduce((s, e) => s + e.amount, 0)
  const totalPaid    = expenses.reduce((s, e) => s + getPaid(e.id), 0)
  const totalPending = expenses.filter(e => !isPaid(e.id)).reduce((s, e) => s + e.amount, 0)

  const mes = format(new Date(), 'MMMM yyyy', { locale: es })

  const formInitial = modal?.id ? modal : (modal?._new ? modal : null)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Fijos</h1>
          <p className="text-gray-500 text-sm capitalize">{mes}</p>
        </div>
        <Button onClick={() => setShowPicker(true)} size="md">
          <IconPlus size={16} /> Nuevo
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total mensual', value: fmt(totalMonthly), color: 'text-gray-900' },
          { label: 'Pagado',        value: fmt(totalPaid),    color: 'text-emerald-600' },
          { label: 'Pendiente',     value: fmt(totalPending), color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconRefresh size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin gastos fijos configurados</p>
          <button onClick={() => setShowPicker(true)} className="text-primary-600 text-sm mt-2 hover:underline">
            Agregar uno
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {expenses.map(e => {
              const paid       = isPaid(e.id)
              const paidAmount = getPaid(e.id)
              const cat = categories.find(c => c.id === e.category_id)
              const pm  = paymentMethods.find(m => m.id === e.payment_method_id)
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paid ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    {(e.icon || cat?.icon)
                      ? <IconDisplay icon={e.icon || cat?.icon} size={24} />
                      : <span className="text-xl">📋</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                    <p className="text-xs text-gray-400">
                      {FREQ_LABELS[e.frequency]}
                      {e.day_of_month ? ` · día ${e.day_of_month}` : ''}
                      {cat ? ` · ${cat.name}` : ''}
                      {pm  ? ` · ${pm.name}`  : ''}
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
                        <IconCheck size={13} /> Pagado
                      </span>
                    ) : (
                      <button onClick={() => setPayModal(e)}
                        className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap">
                        Pagar
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => setModal(e)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-primary-600 transition">
                        <IconPencil size={14} />
                      </button>
                      <button onClick={() => remove(e.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Picker de categorías */}
      {showPicker && (
        <CategoryPickerModal
          categories={categories}
          existingExpenses={expenses}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Formulario (nuevo o editar) */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar gasto fijo' : 'Configurar gasto fijo'}
      >
        {modal && (
          <RecurringForm
            initial={formInitial}
            categories={categories}
            paymentMethods={paymentMethods}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Pago */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Registrar pago">
        {payModal && (
          <PayModal expense={payModal} onPay={handlePay} onCancel={() => setPayModal(null)} />
        )}
      </Modal>
    </div>
  )
}
