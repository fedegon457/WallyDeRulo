import { useEffect, useState } from 'react'
import { IconPlus, IconPencil, IconTrash, IconArrowsUpDown, IconChevronRight, IconX, IconArrowsLeftRight, IconDownload } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoTransactions, demoCategories, demoPaymentMethods } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select, AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { CategorySheet } from '../components/ui/CategorySheet'
import { IconDisplay } from '../components/ui/EmojiPicker'
import { PaymentMethodSheet } from '../components/ui/PaymentMethodSheet'
import { ReceiptButton } from '../components/ui/ReceiptButton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fmt } from '../lib/fmt'

function FormRow({ label, onClick, children }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center min-h-[52px] border-b border-gray-100 last:border-0 gap-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 rounded-lg -mx-1 px-1' : ''}`}
    >
      <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>
    </div>
  )
}

function TransactionForm({ initial, categories, paymentMethods, onSave, onCancel, onCreateCategory, userId }) {
  const isTransferInitial = initial?.transfer_group_id != null
  const [type, setType] = useState(isTransferInitial ? 'transfer' : (initial?.type ?? 'expense'))
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [date, setDate] = useState(initial?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(initial?.payment_method_id ?? '')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [installments, setInstallments] = useState(1)

  const topCats = categories.filter(c => !c.parent_id && c.type === type)
  const allSubcats = categories.filter(c => c.parent_id && topCats.some(p => p.id === c.parent_id))
  const visibleCategories = [...topCats, ...allSubcats]

  const selectedCat = categories.find(c => c.id === categoryId)
  const selectedParent = selectedCat?.parent_id ? categories.find(c => c.id === selectedCat.parent_id) : null
  const selectedPM = paymentMethods.find(m => m.id === paymentMethodId)
  const fromAccount = paymentMethods.find(m => m.id === fromAccountId)
  const toAccount = paymentMethods.find(m => m.id === toAccountId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    if (type === 'transfer') {
      await onSave({ isTransfer: true, amount: parseFloat(amount), date, fromAccountId, toAccountId, notes })
    } else {
      await onSave({ type, amount: parseFloat(amount), date, category_id: categoryId || null, payment_method_id: paymentMethodId || null, notes, installments })
    }
    setSaving(false)
  }

  const typeBtn = (t, label, activeClass) => (
    <button type="button" onClick={() => { setType(t); setCategoryId('') }}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${type === t ? `bg-white shadow-sm ${activeClass}` : 'text-gray-400'}`}>
      {label}
    </button>
  )

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
          {typeBtn('expense', 'Egreso', 'text-red-600')}
          {typeBtn('income', 'Ingreso', 'text-emerald-600')}
          {typeBtn('transfer', 'Transferencia', 'text-primary-600')}
        </div>

        <div className="mb-5">
          <FormRow label="Fecha">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="text-base text-gray-900 bg-transparent border-none outline-none w-full" />
          </FormRow>

          <FormRow label="Importe">
            <span className="text-sm text-gray-400">$</span>
            <AmountInput value={amount} onChange={setAmount}
              required placeholder="0" autoFocus
              className="flex-1 text-base text-gray-900 bg-transparent border-none outline-none" />
          </FormRow>

          {type === 'transfer' ? (
            <>
              <FormRow label="De" onClick={() => setFromOpen(true)}>
                {fromAccount
                  ? <span className="flex items-center gap-1.5 text-sm text-gray-900">
                      {fromAccount.icon && <IconDisplay icon={fromAccount.icon} size={15} />}{fromAccount.name}
                    </span>
                  : <span className="text-sm text-gray-300">Cuenta origen</span>}
                <IconChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
              </FormRow>
              <FormRow label="A" onClick={() => setToOpen(true)}>
                {toAccount
                  ? <span className="flex items-center gap-1.5 text-sm text-gray-900">
                      {toAccount.icon && <IconDisplay icon={toAccount.icon} size={15} />}{toAccount.name}
                    </span>
                  : <span className="text-sm text-gray-300">Cuenta destino</span>}
                <IconChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
              </FormRow>
            </>
          ) : (
            <>
              <FormRow label="Categoría" onClick={() => setCatOpen(true)}>
                {selectedCat ? (
                  <span className="flex items-center gap-1.5 text-sm text-gray-900">
                    {selectedCat.icon && <IconDisplay icon={selectedCat.icon} size={16} />}
                    {selectedParent ? `${selectedParent.name} › ` : ''}{selectedCat.name}
                  </span>
                ) : <span className="text-sm text-gray-300">Sin categoría</span>}
                <IconChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
              </FormRow>
              <FormRow label="Cuenta" onClick={() => setAccountOpen(true)}>
                {selectedPM
                  ? <span className="flex items-center gap-1.5 text-sm text-gray-900">
                      {selectedPM.icon && <IconDisplay icon={selectedPM.icon} size={15} />}{selectedPM.name}
                    </span>
                  : <span className="text-sm text-gray-300">Sin especificar</span>}
                <IconChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
              </FormRow>
              {type === 'expense' && selectedPM?.account_type === 'credit_card' && (
                <FormRow label="Cuotas">
                  <select value={installments} onChange={e => setInstallments(Number(e.target.value))}
                    className="text-base text-gray-900 bg-transparent border-none outline-none">
                    {[1,2,3,6,9,12,18,24].map(n => (
                      <option key={n} value={n}>{n === 1 ? 'Sin cuotas' : `${n} cuotas${amount ? ` · $${Math.round(parseFloat(amount||0)/n).toLocaleString('es-AR')}/mes` : ''}`}</option>
                    ))}
                  </select>
                </FormRow>
              )}
            </>
          )}

          <FormRow label="Nota">
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Descripción..."
              className="flex-1 text-base text-gray-900 bg-transparent border-none outline-none" />
          </FormRow>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>

      {catOpen && <CategorySheet categories={visibleCategories} value={categoryId} onChange={setCategoryId} onClose={() => setCatOpen(false)} onCreateCategory={onCreateCategory} userId={userId} type={type} />}
      {accountOpen && <PaymentMethodSheet title="Cuenta" value={paymentMethodId} paymentMethods={paymentMethods} onChange={setPaymentMethodId} onClose={() => setAccountOpen(false)} />}
      {fromOpen && <PaymentMethodSheet title="Cuenta origen" value={fromAccountId} paymentMethods={paymentMethods} onChange={setFromAccountId} onClose={() => setFromOpen(false)} />}
      {toOpen && <PaymentMethodSheet title="Cuenta destino" value={toAccountId} paymentMethods={paymentMethods} onChange={setToAccountId} onClose={() => setToOpen(false)} />}
    </>
  )
}

export function Transacciones() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))

  const load = async () => {
    if (isDemo(user)) {
      setTransactions(demoTransactions)
      setCategories(demoCategories)
      setPaymentMethods(demoPaymentMethods)
      setLoading(false)
      return
    }
    const [txRes, catRes, pmRes] = await Promise.all([
      supabase.from('transactions')
        .select('id, type, amount, date, category_id, payment_method_id, notes, transfer_group_id, receipt_url, created_at, categories(id, name, parent_id, type, icon), payment_methods(id, name, type)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, type, icon, parent_id').eq('user_id', user.id).order('name'),
      supabase.from('payment_methods').select('id, name, type, icon, account_type').eq('user_id', user.id).order('name'),
    ])
    setTransactions(txRes.data ?? [])
    setCategories(catRes.data ?? [])
    setPaymentMethods(pmRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const buildOptimistic = (values) => {
    const cat = categories.find(c => c.id === values.category_id)
    const pm  = paymentMethods.find(m => m.id === values.payment_method_id)
    return {
      id: `optimistic_${Date.now()}`,
      user_id: user.id,
      type: values.type,
      amount: values.amount,
      date: values.date,
      category_id: values.category_id || null,
      payment_method_id: values.payment_method_id || null,
      notes: values.notes || null,
      transfer_group_id: null,
      categories: cat ? { id: cat.id, name: cat.name, parent_id: cat.parent_id, type: cat.type, icon: cat.icon } : null,
      payment_methods: pm ? { id: pm.id, name: pm.name, type: pm.type } : null,
      created_at: new Date().toISOString(),
    }
  }

  const save = async (values) => {
    if (isDemo(user)) { setModal(null); return }

    const isSimple = !values.isTransfer && values.installments <= 1
    if (isSimple) {
      if (!modal?.id) {
        setTransactions(prev => [buildOptimistic(values), ...prev])
      } else {
        const cat = categories.find(c => c.id === values.category_id)
        const pm  = paymentMethods.find(m => m.id === values.payment_method_id)
        setTransactions(prev => prev.map(t =>
          t.id === modal.id
            ? { ...t, ...values,
                categories: cat ? { id: cat.id, name: cat.name, parent_id: cat.parent_id, type: cat.type, icon: cat.icon } : t.categories,
                payment_methods: pm ? { id: pm.id, name: pm.name, type: pm.type } : t.payment_methods,
              }
            : t
        ))
      }
    }
    setModal(null)

    if (values.isTransfer) {
      const groupId = crypto.randomUUID()
      const fromName = paymentMethods.find(m => m.id === values.fromAccountId)?.name ?? ''
      const toName = paymentMethods.find(m => m.id === values.toAccountId)?.name ?? ''
      await supabase.from('transactions').insert([
        { user_id: user.id, type: 'expense', amount: values.amount, date: values.date, payment_method_id: values.fromAccountId || null, transfer_group_id: groupId, notes: values.notes || `Transferencia → ${toName}` },
        { user_id: user.id, type: 'income',  amount: values.amount, date: values.date, payment_method_id: values.toAccountId || null,   transfer_group_id: groupId, notes: values.notes || `Transferencia desde ${fromName}` },
      ])
    } else if (values.installments > 1) {
      const groupId = crypto.randomUUID()
      const cuotaAmount = Math.round((values.amount / values.installments) * 100) / 100
      const rows = Array.from({ length: values.installments }, (_, i) => {
        const d = new Date(values.date + 'T12:00:00')
        d.setMonth(d.getMonth() + i)
        return {
          user_id: user.id, type: values.type, amount: cuotaAmount,
          date: format(d, 'yyyy-MM-dd'),
          category_id: values.category_id, payment_method_id: values.payment_method_id,
          notes: `${values.notes || ''} (${i + 1}/${values.installments})`.trim(),
          installments: values.installments, installment_number: i + 1,
          installment_group_id: groupId,
        }
      })
      await supabase.from('transactions').insert(rows)
    } else if (modal?.id) {
      const { installments: _, ...rest } = values
      await supabase.from('transactions').update(rest).eq('id', modal.id).eq('user_id', user.id)
    } else {
      const { installments: _, ...rest } = values
      await supabase.from('transactions').insert({ ...rest, user_id: user.id })
    }
    load()
  }

  const updateReceipt = (id, url) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, receipt_url: url } : t))
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta transacción?')) return
    const tx = transactions.find(t => t.id === id)
    if (tx?.transfer_group_id) {
      setTransactions(prev => prev.filter(t => t.transfer_group_id !== tx.transfer_group_id))
      await supabase.from('transactions').delete().eq('transfer_group_id', tx.transfer_group_id).eq('user_id', user.id)
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id))
      await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    }
    load()
  }

  const handleCreateCategory = (newCat) => {
    setCategories(prev => [...prev, newCat])
  }

  const filtered = transactions.filter(t => {
    if (filterType === 'income'   && (t.type !== 'income'  || t.transfer_group_id)) return false
    if (filterType === 'expense'  && (t.type !== 'expense' || t.transfer_group_id)) return false
    if (filterType === 'transfer' && !t.transfer_group_id) return false
    if (filterMonth && !t.date.startsWith(filterMonth)) return false
    if (search) {
      const q = search.toLowerCase()
      return (t.notes ?? '').toLowerCase().includes(q) || (t.categories?.name ?? '').toLowerCase().includes(q)
    }
    return true
  })

  // Deduplicar transfers para no mostrar las dos patas
  const seenGroups = new Set()
  const displayList = filtered.filter(t => {
    if (!t.transfer_group_id) return true
    if (seenGroups.has(t.transfer_group_id)) return false
    seenGroups.add(t.transfer_group_id)
    return true
  })

  const nonTransfer  = filtered.filter(t => !t.transfer_group_id)
  const totalIncome  = nonTransfer.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = nonTransfer.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const exportCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Cuenta/Método', 'Importe', 'Nota']
    const rows = displayList.map(t => {
      const cat = categories.find(c => c.id === t.category_id)
      const parentCat = cat?.parent_id ? categories.find(c => c.id === cat.parent_id) : null
      const pm = paymentMethods.find(m => m.id === t.payment_method_id)
      const catName = parentCat ? `${parentCat.name} > ${cat?.name}` : (cat?.name ?? '')
      const type = t.transfer_group_id ? 'Transferencia' : t.type === 'income' ? 'Ingreso' : 'Egreso'
      return [t.date, type, catName, pm?.name ?? '', t.amount, t.notes ?? '']
    })
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `mywalli_${filterMonth || format(new Date(), 'yyyy-MM')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-500 text-sm">Registrá todos tus movimientos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <IconDownload size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Button onClick={() => setModal({})} size="md">
            <IconPlus size={16} /> Nueva
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <Input
          className="flex-1 min-w-40"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="min-w-36">
          <option value="all">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Egresos</option>
          <option value="transfer">Transferencias</option>
        </Select>
        <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="min-w-36" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: fmt(totalIncome), color: 'text-emerald-600' },
          { label: 'Egresos', value: fmt(totalExpense), color: 'text-red-500' },
          { label: 'Balance', value: fmt(totalIncome - totalExpense), color: totalIncome - totalExpense >= 0 ? 'text-primary-600' : 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconArrowsUpDown size={40} className="mx-auto mb-3 opacity-30" />
          <p>Sin transacciones para mostrar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {displayList.map(t => {
              const isTransfer = !!t.transfer_group_id
              const cat = categories.find(c => c.id === t.category_id)
              const parentCat = cat?.parent_id ? categories.find(c => c.id === cat.parent_id) : null
              const pm = paymentMethods.find(m => m.id === t.payment_method_id)
              // Para transferencias, buscar la otra pata
              const partner = isTransfer ? transactions.find(p => p.transfer_group_id === t.transfer_group_id && p.id !== t.id) : null
              const fromPM = isTransfer && t.type === 'expense' ? pm : (partner ? paymentMethods.find(m => m.id === partner.payment_method_id) : null)
              const toPM   = isTransfer && t.type === 'income'  ? pm : (partner ? paymentMethods.find(m => m.id === partner.payment_method_id) : null)

              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isTransfer ? 'bg-primary-50' : t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {isTransfer
                      ? <IconArrowsLeftRight size={18} className="text-primary-500" />
                      : <IconDisplay icon={cat?.icon || (t.type === 'income' ? 'IconTrendingUp:#22C55E' : 'IconShoppingCart:#EF4444')} size={20} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {isTransfer ? `${fromPM?.name ?? '?'} → ${toPM?.name ?? '?'}` : (t.notes || cat?.name || '—')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isTransfer ? 'Transferencia' : `${parentCat ? `${parentCat.name} › ` : ''}${cat?.name ?? ''}${pm ? ` · ${pm.name}` : ''}`}
                      {' · '}{format(new Date(t.date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${isTransfer ? 'text-primary-600' : t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isTransfer ? '' : (t.type === 'income' ? '+' : '-')}{fmt(t.amount)}
                  </span>
                  <div className="flex gap-0.5">
                    {!isTransfer && !isDemo(user) && (
                      <ReceiptButton
                        transactionId={t.id}
                        userId={user.id}
                        receiptUrl={t.receipt_url}
                        onUpdate={(url) => updateReceipt(t.id, url)}
                      />
                    )}
                    {!isTransfer && (
                      <button onClick={() => setModal(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition">
                        <IconPencil size={14} />
                      </button>
                    )}
                    <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar transacción' : 'Nueva transacción'}
      >
        {modal && (
          <TransactionForm
            initial={modal?.id ? modal : null}
            categories={categories}
            paymentMethods={paymentMethods}
            onSave={save}
            onCancel={() => setModal(null)}
            onCreateCategory={handleCreateCategory}
            userId={user?.id}
          />
        )}
      </Modal>
    </div>
  )
}
