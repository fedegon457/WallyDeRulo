import { useEffect, useState } from 'react'
import { IconPlus, IconChevronDown, IconChevronUp, IconUsers, IconCircleCheck, IconCircle, IconCurrencyDollar, IconArrowRight, IconArrowLeft, IconX } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoSharedExpenses, demoCategories, demoPaymentMethods } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Textarea, AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { CustomSelect, buildPmGroups } from '../components/ui/CustomSelect'
import { CategorySheet } from '../components/ui/CategorySheet'
import { IconDisplay } from '../components/ui/EmojiPicker'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function NewExpenseForm({ categories, paymentMethods, onSave, onCancel }) {
  const [paidByMe, setPaidByMe] = useState(true)
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [participants, setParticipants] = useState([{ name: '', amount: '' }])
  const [paidByName, setPaidByName] = useState('')
  const [userShare, setUserShare] = useState('')
  const [saving, setSaving] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  const addParticipant = () => setParticipants(p => [...p, { name: '', amount: '' }])
  const removeParticipant = (i) => setParticipants(p => p.filter((_, idx) => idx !== i))
  const updateParticipant = (i, field, val) =>
    setParticipants(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const splitEvenly = () => {
    const total = parseFloat(totalAmount)
    if (!total || participants.length === 0) return
    const each = (total / participants.length).toFixed(2)
    setParticipants(p => p.map(item => ({ ...item, amount: each })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    if (paidByMe) {
      const valid = participants.filter(p => p.name.trim())
      if (valid.length === 0) { setSaving(false); return alert('Agregá al menos un participante') }
      await onSave({
        description, total_amount: parseFloat(totalAmount), date, notes,
        paid_by_me: true, paid_by_name: null, user_share: null,
        category_id: categoryId || null, payment_method_id: paymentMethodId || null,
        participants: valid.map(p => ({ name: p.name.trim(), amount_owed: parseFloat(p.amount) || 0 })),
      })
    } else {
      if (!paidByName.trim()) { setSaving(false); return alert('Ingresá quién pagó') }
      await onSave({
        description, total_amount: parseFloat(totalAmount), date, notes,
        paid_by_me: false, paid_by_name: paidByName.trim(), user_share: parseFloat(userShare) || 0,
        category_id: categoryId || null, payment_method_id: paymentMethodId || null,
        participants: [],
      })
    }
    setSaving(false)
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const selectedCat = categories.find(c => c.id === categoryId)
  const selectedParentCat = selectedCat?.parent_id ? categories.find(c => c.id === selectedCat.parent_id) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">¿Quién pagó?</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPaidByMe(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition flex items-center justify-center gap-2 ${paidByMe ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
            <IconArrowRight size={15} /> Yo pagué
          </button>
          <button type="button" onClick={() => setPaidByMe(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition flex items-center justify-center gap-2 ${!paidByMe ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
            <IconArrowLeft size={15} /> Otra persona
          </button>
        </div>
      </div>

      <Input label="Descripción" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ej: Cena, almuerzo, taxi..." />

      <div className="grid grid-cols-2 gap-3">
        <AmountInput label="Total del gasto ($)" value={totalAmount} onChange={setTotalAmount} required placeholder="0" />
        <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <CustomSelect
          label="Método de pago"
          value={paymentMethodId}
          onChange={setPaymentMethodId}
          placeholder="— Sin especificar —"
          groups={buildPmGroups(paymentMethods)}
        />
      </div>

      <Textarea label="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Detalles..." />

      {paidByMe ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">¿Quiénes me deben?</label>
            <Button type="button" variant="ghost" size="sm" onClick={splitEvenly}>Dividir en partes iguales</Button>
          </div>
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Nombre" value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)} className="flex-1" />
                <AmountInput placeholder="Monto $" value={p.amount} onChange={v => updateParticipant(i, 'amount', v)} className="w-32" />
                {participants.length > 1 && (
                  <button type="button" onClick={() => removeParticipant(i)} className="px-2 text-gray-400 hover:text-red-500">✕</button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addParticipant} className="mt-2">
            <IconPlus size={14} /> Agregar persona
          </Button>
        </div>
      ) : (
        <div className="space-y-3 bg-primary-50 rounded-xl p-4">
          <Input label="¿Quién pagó?" value={paidByName} onChange={e => setPaidByName(e.target.value)} required placeholder="Nombre de la persona" />
          <AmountInput label="Mi parte a pagar ($)" value={userShare} onChange={setUserShare} required placeholder="0" />
          <p className="text-xs text-primary-600">Se registrará un egreso cuando marques que pagaste</p>
        </div>
      )}

      <div className={`rounded-xl p-3 text-sm flex items-start gap-2 ${paidByMe ? 'bg-primary-50 text-primary-700' : 'bg-primary-50 text-primary-700'}`}>
        <span>💡</span>
        <span>
          {paidByMe
            ? 'Se creará automáticamente un egreso en Transacciones por el total pagado.'
            : 'Se creará un egreso en Transacciones cuando marques que pagaste tu parte.'}
        </span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

function PaymentModal({ participant, paymentMethods, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(participant.id, { amount: parseFloat(amount), date, notes, payment_method_id: paymentMethodId || null })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Cobro de <strong className="text-gray-900">{participant.name}</strong></p>
      <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <AmountInput label="Importe ($)" value={amount} onChange={setAmount} required placeholder="0" />
      <CustomSelect
        label="Cuenta"
        value={paymentMethodId}
        onChange={setPaymentMethodId}
        groups={buildPmGroups(paymentMethods)}
      />
      <Input label="Nota" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Transferencia, efectivo, etc." />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" variant="success" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Registrar cobro'}</Button>
      </div>
    </form>
  )
}

function MyPaymentModal({ expense, paymentMethods, onSave, onClose }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState(expense.payment_method_id ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(expense.id, {
      user_paid_back: true,
      user_paid_back_date: date,
      user_paid_back_notes: notes,
      payment_method_id: paymentMethodId || null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Pago a <strong className="text-gray-900">{expense.paid_by_name}</strong> · <strong className="text-gray-900">{fmt(expense.user_share)}</strong>
      </p>
      <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <CustomSelect
        label="Cuenta"
        value={paymentMethodId}
        onChange={setPaymentMethodId}
        groups={buildPmGroups(paymentMethods)}
      />
      <Input label="Nota" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Transferencia, efectivo, etc." />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button type="submit" variant="success" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Marcar como pagado'}</Button>
      </div>
    </form>
  )
}

function ExpenseCard({ expense, paymentMethods, onDelete, onRefresh, userId }) {
  const [expanded, setExpanded] = useState(false)
  const [payModal, setPayModal] = useState(null)
  const [myPayModal, setMyPayModal] = useState(false)

  const isPaidByMe = expense.paid_by_me !== false
  const totalOwed = isPaidByMe ? (expense.participants?.reduce((s, p) => s + p.amount_owed, 0) ?? 0) : 0
  const totalPaid = isPaidByMe ? (expense.participants?.reduce((s, p) => s + (p.payments?.reduce((ps, pay) => ps + pay.amount, 0) ?? 0), 0) ?? 0) : 0
  const totalPending = isPaidByMe ? totalOwed - totalPaid : 0
  const iOwePending = !isPaidByMe && !expense.user_paid_back ? (expense.user_share ?? 0) : 0
  const allSettled = isPaidByMe ? totalPending <= 0 : expense.user_paid_back

  const registerPayment = async (participantId, values) => {
    const { payment_method_id, ...paymentData } = values
    await supabase.from('shared_expense_payments').insert({ participant_id: participantId, ...paymentData })
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'income',
      amount: values.amount,
      date: values.date,
      category_id: expense.category_id ?? null,
      payment_method_id: payment_method_id ?? expense.payment_method_id ?? null,
      notes: `Cobro de ${expense.participants?.find(p => p.id === participantId)?.name ?? ''} — ${expense.description}`,
    })
    setPayModal(null)
    onRefresh()
  }

  const registerMyPayment = async (id, values) => {
    const { payment_method_id, ...updateData } = values
    await supabase.from('shared_expenses').update(updateData).eq('id', id)
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'expense',
      amount: expense.user_share,
      date: values.user_paid_back_date,
      category_id: expense.category_id ?? null,
      payment_method_id: payment_method_id ?? expense.payment_method_id ?? null,
      notes: `Pago a ${expense.paid_by_name} — ${expense.description}`,
    })
    setMyPayModal(false)
    onRefresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${allSettled ? 'bg-emerald-400' : isPaidByMe ? 'bg-orange-400' : 'bg-primary-400'}`} />
              <p className="font-semibold text-gray-900 truncate">{expense.description}</p>
              {!isPaidByMe && (
                <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                  Pagó {expense.paid_by_name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })} · Total: {fmt(expense.total_amount)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {isPaidByMe ? (
              <p className={`font-bold text-sm ${allSettled ? 'text-emerald-600' : 'text-orange-500'}`}>
                {allSettled ? 'Cobrado ✓' : `Me deben ${fmt(totalPending)}`}
              </p>
            ) : (
              <p className={`font-bold text-sm ${allSettled ? 'text-emerald-600' : 'text-primary-600'}`}>
                {allSettled ? 'Pagado ✓' : `Debo ${fmt(iOwePending)}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
            {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            {expanded ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
          <span className="text-gray-200">|</span>
          <button onClick={() => onDelete(expense.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">Eliminar</button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
          {expense.notes && <p className="text-xs text-gray-500 italic">{expense.notes}</p>}

          {isPaidByMe ? (
            expense.participants?.map(p => {
              const paid = p.payments?.reduce((s, pay) => s + pay.amount, 0) ?? 0
              const pending = p.amount_owed - paid
              const isFullyPaid = pending <= 0
              return (
                <div key={p.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isFullyPaid ? <IconCircleCheck size={16} className="text-emerald-500" /> : <IconCircle size={16} className="text-gray-300" />}
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isFullyPaid ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {isFullyPaid ? 'Pagó ✓' : `Debe ${fmt(pending)}`}
                      </span>
                      {!isFullyPaid && (
                        <Button size="sm" variant="success" onClick={() => setPayModal(p)}>
                          <IconCurrencyDollar size={12} /> Cobré
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 ml-6">Debe: {fmt(p.amount_owed)} · Pagado: {fmt(paid)}</p>
                  {p.payments?.length > 0 && (
                    <div className="mt-2 ml-6 space-y-1">
                      {p.payments.map(pay => (
                        <div key={pay.id} className="flex justify-between text-xs text-gray-500">
                          <span>{format(new Date(pay.date), 'dd/MM/yy')}{pay.notes ? ` · ${pay.notes}` : ''}</span>
                          <span className="text-emerald-600">+{fmt(pay.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-primary-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expense.user_paid_back ? <IconCircleCheck size={16} className="text-emerald-500" /> : <IconCircle size={16} className="text-primary-200" />}
                  <span className="text-sm font-medium text-gray-800">Mi parte</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${expense.user_paid_back ? 'text-emerald-600' : 'text-primary-600'}`}>
                    {expense.user_paid_back ? 'Pagado ✓' : `Debo ${fmt(expense.user_share)}`}
                  </span>
                  {!expense.user_paid_back && (
                    <Button size="sm" variant="primary" onClick={() => setMyPayModal(true)}>
                      <IconCurrencyDollar size={12} /> Pagué
                    </Button>
                  )}
                </div>
              </div>
              {expense.user_paid_back && expense.user_paid_back_date && (
                <p className="text-xs text-gray-400 ml-6 mt-1">
                  Pagado el {format(new Date(expense.user_paid_back_date), 'dd/MM/yy')}
                  {expense.user_paid_back_notes ? ` · ${expense.user_paid_back_notes}` : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Registrar cobro" size="sm">
        {payModal && <PaymentModal participant={payModal} paymentMethods={paymentMethods} onSave={registerPayment} onClose={() => setPayModal(null)} />}
      </Modal>
      <Modal open={myPayModal} onClose={() => setMyPayModal(false)} title="Registrar mi pago" size="sm">
        {myPayModal && <MyPaymentModal expense={expense} paymentMethods={paymentMethods} onSave={registerMyPayment} onClose={() => setMyPayModal(false)} />}
      </Modal>
    </div>
  )
}

export function Compartidos() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const load = async () => {
    if (isDemo(user)) {
      setExpenses(demoSharedExpenses)
      setCategories(demoCategories)
      setPaymentMethods(demoPaymentMethods)
      setLoading(false)
      return
    }
    const [{ data: exp }, { data: cats }, { data: pms }] = await Promise.all([
      supabase.from('shared_expenses')
        .select(`*, participants:shared_expense_participants(*, payments:shared_expense_payments(*))`)
        .eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name'),
    ])
    setExpenses(exp ?? [])
    setCategories(cats ?? [])
    setPaymentMethods(pms ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const saveExpense = async ({ participants, ...values }) => {
    const { data: expense } = await supabase
      .from('shared_expenses')
      .insert({ ...values, user_id: user.id })
      .select().single()

    if (expense) {
      if (participants.length > 0) {
        await supabase.from('shared_expense_participants').insert(
          participants.map(p => ({ ...p, shared_expense_id: expense.id }))
        )
      }
      // Crear egreso automático solo si yo pagué
      if (values.paid_by_me) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'expense',
          amount: values.total_amount,
          date: values.date,
          category_id: values.category_id ?? null,
          payment_method_id: values.payment_method_id ?? null,
          notes: `Gasto compartido: ${values.description}`,
        })
      }
    }
    setModal(false)
    load()
  }

  const deleteExpense = async (id) => {
    if (!confirm('¿Eliminar este gasto compartido?')) return
    await supabase.from('shared_expenses').delete().eq('id', id)
    load()
  }

  const isPending = (e) => {
    if (e.paid_by_me === false) return !e.user_paid_back
    const owed = e.participants?.reduce((s, p) => s + p.amount_owed, 0) ?? 0
    const paid = e.participants?.reduce((s, p) => s + (p.payments?.reduce((ps, pay) => ps + pay.amount, 0) ?? 0), 0) ?? 0
    return owed > paid
  }

  const filtered = expenses.filter(e => filter === 'all' ? true : filter === 'pending' ? isPending(e) : !isPending(e))

  const totalMeDeben = expenses.filter(e => e.paid_by_me !== false).reduce((s, e) => {
    const owed = e.participants?.reduce((ps, p) => ps + p.amount_owed, 0) ?? 0
    const paid = e.participants?.reduce((ps, p) => ps + (p.payments?.reduce((pps, pay) => pps + pay.amount, 0) ?? 0), 0) ?? 0
    return s + Math.max(0, owed - paid)
  }, 0)

  const totalDebo = expenses.filter(e => e.paid_by_me === false && !e.user_paid_back)
    .reduce((s, e) => s + (e.user_share ?? 0), 0)

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos compartidos</h1>
          <p className="text-gray-500 text-sm">Balance con tus amigos</p>
        </div>
        <Button onClick={() => setModal(true)} size="md">
          <IconPlus size={16} /> Nuevo gasto
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <IconArrowRight size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Me deben</p>
            <p className="text-lg font-bold text-orange-500">{fmt(totalMeDeben)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
            <IconArrowLeft size={18} className="text-primary-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Debo</p>
            <p className="text-lg font-bold text-primary-600">{fmt(totalDebo)}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1">
        {[['pending', 'Pendientes'], ['paid', 'Saldados'], ['all', 'Todos']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${filter === val ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconUsers size={40} className="mx-auto mb-3 opacity-30" />
          <p>{filter === 'pending' ? 'No hay gastos pendientes' : 'Sin gastos en esta categoría'}</p>
          <Button onClick={() => setModal(true)} variant="secondary" className="mt-4">Agregar gasto</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <ExpenseCard key={e.id} expense={e} paymentMethods={paymentMethods} onDelete={deleteExpense} onRefresh={load} userId={user.id} />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo gasto compartido" size="lg">
        <NewExpenseForm
          categories={categories}
          paymentMethods={paymentMethods}
          onSave={saveExpense}
          onCancel={() => setModal(false)}
        />
      </Modal>
    </div>
  )
}
