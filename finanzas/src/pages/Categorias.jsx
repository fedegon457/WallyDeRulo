import { useEffect, useState, useMemo } from 'react'
import { IconPlus, IconPencil, IconTrash, IconChevronRight, IconTag, IconRefresh, IconCheck, IconX, IconCash } from '@tabler/icons-react'
import { CHART_COLORS } from '../lib/chartColors'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoCategories, demoPaymentMethods, demoTransactions, demoCatAdd, demoCatUpdate, demoCatRemove, demoREAdd } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { IconDisplay } from '../components/ui/EmojiPicker'
import { IconPicker } from '../components/ui/IconPicker'
import { format, startOfMonth } from 'date-fns'
import { fmt } from '../lib/fmt'

const FREQ_LABELS = { monthly: 'Mensual', weekly: 'Semanal', yearly: 'Anual' }

function QuickPayModal({ category, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount) { setError('Ingresá un importe'); return }
    setSaving(true)
    await onSave({ category_id: category.id, amount: parseFloat(amount), date, notes: notes || null })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/85 backdrop-blur-2xl border border-white/40 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="w-10 h-1 bg-gray-400/40 rounded-full mx-auto sm:hidden" />

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            {category.icon
              ? <IconDisplay icon={category.icon} size={24} />
              : <span className="text-xl">📋</span>
            }
          </div>
          <div>
            <p className="font-semibold text-gray-900">{category.name}</p>
            <p className="text-xs text-gray-400">Registrar gasto</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Importe</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm select-none">$</span>
              <AmountInput
                value={amount}
                onChange={(v) => { setAmount(v); setError('') }}
                required
                autoFocus
                placeholder="0"
                className={`w-full pl-8 pr-4 py-3 text-lg font-semibold border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Descripción..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar gasto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Fila de subcategoría en modo display ────────────────────────────────────
function SubcategoryRow({ sub, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 group transition-colors">
      <div className="flex items-center gap-2">
        {sub.icon
          ? <IconDisplay icon={sub.icon} size={16} />
          : <span className="w-4 text-center text-gray-300">·</span>
        }
        <span className="text-sm text-gray-700">{sub.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-500 transition-colors"
        >
          <IconPencil size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
        >
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Input inline para agregar/editar subcategoría ───────────────────────────
function SubcategoryInput({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), icon)
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2">
      <IconPicker value={icon} onChange={setIcon} compact />
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre de la subcategoría..."
        className="flex-1 text-base bg-transparent outline-none text-gray-700 placeholder-gray-400"
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
      >
        <IconCheck size={15} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <IconX size={15} />
      </button>
    </form>
  )
}

// ─── Gestor inline de subcategorías ──────────────────────────────────────────
function SubcategoriesManager({ parent, categories, user, onRefresh }) {
  const subs = categories.filter(c => c.parent_id === parent.id)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const doAdd = async (name, icon) => {
    const values = { name, type: parent.type, parent_id: parent.id, icon: icon || null }
    if (isDemo(user)) {
      demoCatAdd({ ...values, id: `c_${Date.now()}`, user_id: 'demo' })
    } else {
      await supabase.from('categories').insert({ ...values, user_id: user.id })
    }
    setAdding(false)
    onRefresh()
  }

  const doUpdate = async (sub, name, icon) => {
    if (isDemo(user)) {
      demoCatUpdate(sub.id, { name, icon: icon || null })
    } else {
      await supabase.from('categories').update({ name, icon: icon || null }).eq('id', sub.id).eq('user_id', user.id)
    }
    setEditingId(null)
    onRefresh()
  }

  const doDelete = async (sub) => {
    if (!confirm(`¿Eliminar "${sub.name}"?`)) return
    if (isDemo(user)) {
      demoCatRemove(sub.id)
    } else {
      await supabase.from('categories').delete().eq('id', sub.id).eq('user_id', user.id)
    }
    onRefresh()
  }

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">
          Subcategorías
          {subs.length > 0 && (
            <span className="ml-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
              {subs.length}
            </span>
          )}
        </span>
        {!adding && !editingId && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <IconPlus size={13} /> Agregar
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {subs.map(sub =>
          editingId === sub.id
            ? <SubcategoryInput
                key={sub.id}
                initial={sub}
                onSave={(n, i) => doUpdate(sub, n, i)}
                onCancel={() => setEditingId(null)}
              />
            : <SubcategoryRow
                key={sub.id}
                sub={sub}
                onEdit={() => { setAdding(false); setEditingId(sub.id) }}
                onDelete={() => doDelete(sub)}
              />
        )}

        {subs.length === 0 && !adding && (
          <p className="text-xs text-gray-400 py-3 text-center">
            Sin subcategorías — agregá una para organizar mejor
          </p>
        )}

        {adding && (
          <SubcategoryInput
            onSave={doAdd}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Formulario de categoría ──────────────────────────────────────────────────
function CategoryForm({ initial, parents, paymentMethods, lockAsParent, onSave, onCancel }) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [type, setType]           = useState(initial?.type ?? 'expense')
  const [isSub, setIsSub]         = useState(!!initial?.parent_id)
  const [parentId, setParentId]   = useState(initial?.parent_id ?? '')
  const [icon, setIcon]           = useState(initial?.icon ?? '')
  const [isFixed, setIsFixed]     = useState(false)
  const [amount, setAmount]       = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [pmId, setPmId]           = useState('')
  const [saving, setSaving]       = useState(false)

  const availableParents = parents.filter(p => !p.parent_id && p.type === type && p.id !== initial?.id)

  const handleTypeChange = (t) => { setType(t); setParentId('') }
  const handleIsSub = (val) => { setIsSub(val); if (!val) setParentId('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSub && !parentId) return
    setSaving(true)
    const catValues = {
      name,
      type,
      parent_id: isSub ? parentId : null,
      icon: icon || null,
    }
    const recurringData = isFixed && amount ? {
      name,
      icon: icon || null,
      amount: parseFloat(amount),
      frequency,
      day_of_month: frequency === 'monthly' && dayOfMonth ? parseInt(dayOfMonth) : null,
      payment_method_id: pmId || null,
      is_active: true,
    } : null
    await onSave(catValues, recurringData)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Egreso / Ingreso */}
      <div className="flex gap-2">
        {[['expense','Egreso','bg-red-50 border-red-300 text-red-700'],
          ['income','Ingreso','bg-emerald-50 border-emerald-300 text-emerald-700']].map(([val, lbl, cls]) => (
          <button key={val} type="button" onClick={() => handleTypeChange(val)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${type === val ? cls : 'border-gray-200 text-gray-500'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Ícono + Nombre */}
      <div className="flex gap-3 items-end">
        <IconPicker value={icon} onChange={setIcon} label="Ícono" compact />
        <div className="flex-1">
          <Input
            label="Nombre"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder={isSub ? 'Ej: Restaurantes...' : 'Ej: Comida, Salud...'}
          />
        </div>
      </div>

      {/* Nivel — se oculta si ya es categoría principal siendo editada */}
      {!lockAsParent && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleIsSub(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${!isSub ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
              Principal
            </button>
            <button type="button" onClick={() => handleIsSub(true)}
              disabled={availableParents.length === 0}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${isSub ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-500'} disabled:opacity-40 disabled:cursor-not-allowed`}>
              Subcategoría
            </button>
          </div>
          {isSub && availableParents.length === 0 && (
            <p className="text-xs text-orange-500 mt-1.5">
              Creá primero una categoría principal de tipo {type === 'expense' ? 'Egreso' : 'Ingreso'}.
            </p>
          )}
        </div>
      )}

      {/* Categoría principal — chips */}
      {!lockAsParent && isSub && availableParents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría principal</label>
          <div className="flex flex-wrap gap-2">
            {availableParents.map(p => (
              <button key={p.id} type="button" onClick={() => setParentId(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                  parentId === p.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}>
                {p.icon && <IconDisplay icon={p.icon} size={15} />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gasto fijo toggle */}
      {type === 'expense' && !isSub && (
        <div className={`rounded-xl border-2 transition-colors ${isFixed ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
          <button
            type="button"
            onClick={() => setIsFixed(f => !f)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <IconRefresh size={15} className={isFixed ? 'text-primary-600' : 'text-gray-400'} />
              <span className={`text-sm font-medium ${isFixed ? 'text-primary-700' : 'text-gray-600'}`}>
                ¿Es un gasto fijo o suscripción?
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${isFixed ? 'bg-primary-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFixed ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>

          {isFixed && (
            <div className="px-4 pb-4 space-y-3 border-t border-primary-100 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <AmountInput label="Monto" value={amount} onChange={setAmount} required placeholder="0" />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              {frequency === 'monthly' && (
                <Input
                  label="Día de vencimiento (opcional)"
                  type="number" min="1" max="31"
                  value={dayOfMonth}
                  onChange={e => setDayOfMonth(e.target.value)}
                  placeholder="Ej: 15"
                />
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Método de pago (opcional)</label>
                <select
                  value={pmId}
                  onChange={e => setPmId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">— Sin especificar —</option>
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-primary-600 bg-primary-100 rounded-lg px-3 py-2">
                Se creará un gasto fijo "{name || '...'}" de {FREQ_LABELS[frequency].toLowerCase()} en el módulo Gastos Fijos.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving || (isSub && !parentId)}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export function Categorias() {
  const { user } = useAuth()
  const [categories, setCategories]       = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [modal, setModal]                 = useState(null)
  const [quickPay, setQuickPay]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const [transactions, setTransactions]   = useState([])
  const [selectedCat, setSelectedCat]     = useState(null)

  const load = async () => {
    if (isDemo(user)) {
      setCategories([...demoCategories])
      setPaymentMethods(demoPaymentMethods)
      setTransactions(demoTransactions)
      setLoading(false)
      return
    }
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const [catRes, pmRes, txRes] = await Promise.all([
      supabase.from('categories').select('id, name, type, icon, parent_id').eq('user_id', user.id)
        .order('type').order('parent_id', { nullsFirst: true }).order('name'),
      supabase.from('payment_methods').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('transactions').select('type, amount, category_id, transfer_group_id').eq('user_id', user.id).gte('date', monthStart),
    ])
    setCategories(catRes.data ?? [])
    setPaymentMethods(pmRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values, recurringData) => {
    if (isDemo(user)) {
      if (modal?.id) {
        demoCatUpdate(modal.id, values)
        setCategories([...demoCategories])
      } else {
        const newCat = { ...values, id: `c_${Date.now()}`, user_id: 'demo' }
        demoCatAdd(newCat)
        if (recurringData) {
          demoREAdd({ ...recurringData, id: `re_${Date.now()}`, user_id: 'demo', category_id: newCat.id })
        }
        setCategories([...demoCategories])
      }
      setModal(null)
      return
    }

    if (modal?.id) {
      await supabase.from('categories').update(values).eq('id', modal.id).eq('user_id', user.id)
      if (recurringData) {
        await supabase.from('recurring_expenses').insert({ ...recurringData, category_id: modal.id, user_id: user.id })
      }
    } else {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({ ...values, user_id: user.id })
        .select('id, name, type, icon, parent_id')
        .single()
      if (error) { alert(`Error: ${error.message}`); return }
      if (recurringData && newCat) {
        await supabase.from('recurring_expenses').insert({ ...recurringData, category_id: newCat.id, user_id: user.id })
      }
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    const hasChildren = categories.some(c => c.parent_id === id)
    if (hasChildren) return alert('Esta categoría tiene subcategorías. Eliminá primero las subcategorías.')
    if (!confirm('¿Eliminar esta categoría?')) return
    if (isDemo(user)) {
      setCategories(prev => prev.filter(c => c.id !== id))
      return
    }
    await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
    load()
  }

  const parents   = categories.filter(c => !c.parent_id)
  const byParent  = (pid) => categories.filter(c => c.parent_id === pid)

  const spentByCategory = useMemo(() => {
    const map = {}
    transactions.filter(t => t.type === 'expense' && !t.transfer_group_id).forEach(t => {
      if (t.category_id) map[t.category_id] = (map[t.category_id] || 0) + t.amount
    })
    return map
  }, [transactions])

  const getCatSpent = (cat) => {
    const subs = categories.filter(c => c.parent_id === cat.id)
    return [cat.id, ...subs.map(s => s.id)].reduce((s, id) => s + (spentByCategory[id] || 0), 0)
  }

  // Al recargar mientras el modal de padre está abierto, actualizamos la vista
  // pero mantenemos el modal abierto para no interrumpir al usuario
  const reloadKeepingModal = async () => {
    if (isDemo(user)) {
      setCategories([...demoCategories])
      return
    }
    const { data } = await supabase.from('categories').select('id, name, type, icon, parent_id').eq('user_id', user.id)
      .order('type').order('parent_id', { nullsFirst: true }).order('name')
    setCategories(data ?? [])
  }

  const handleQuickPay = async ({ category_id, amount, date, notes }) => {
    if (isDemo(user)) { setQuickPay(null); return }
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'expense',
      category_id,
      amount,
      date,
      notes: notes || null,
    })
    setQuickPay(null)
  }

  const isEditingParent = modal?.id && !modal?.parent_id

  const renderGrid = (type, label, labelColor) => {
    const topLevel = parents.filter(c => c.type === type)
    if (topLevel.length === 0) return null
    const typeTotal = topLevel.reduce((s, cat) => s + getCatSpent(cat), 0)
    return (
      <div key={type}>
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${labelColor}`}>{label}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {topLevel.map((cat, idx) => {
            const color = CHART_COLORS[idx % CHART_COLORS.length]
            const spent = getCatSpent(cat)
            const pct = typeTotal > 0 ? spent / typeTotal * 100 : 0
            const subs = byParent(cat.id)
            const isSelected = selectedCat?.id === cat.id
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCat(isSelected ? null : cat)}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all ${
                  isSelected ? 'border-gray-200 ring-2 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow'
                }`}
                style={{ /* GGA exception: dynamic ring color from category data */ ...(isSelected ? { boxShadow: `0 0 0 2px ${color}40` } : {}) }}
              >
                <div className="h-1 w-full" style={{ /* GGA exception: colored strip per category from dynamic data */ backgroundColor: color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ /* GGA exception: icon bg derived from dynamic category color */ background: `${color}1f` }}>
                      {cat.icon
                        ? <IconDisplay icon={cat.icon} size={20} style={{ /* GGA exception: icon color from category data */ color }} />
                        : <IconTag size={16} style={{ /* GGA exception: icon color from category data */ color }} />
                      }
                    </div>
                    <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                      {cat.type === 'expense' && (
                        <button onClick={() => setQuickPay(cat)} className="p-1 rounded-lg hover:bg-emerald-50 text-gray-300 hover:text-emerald-500 transition">
                          <IconCash size={12} />
                        </button>
                      )}
                      <button onClick={() => setModal(cat)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-primary-600 transition">
                        <IconPencil size={12} />
                      </button>
                      <button onClick={() => remove(cat.id)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                        <IconTrash size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{fmt(spent)}</p>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ /* GGA exception: dynamic percentage width and color from data */ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {Math.round(pct)}%{subs.length > 0 ? ` · ${subs.length} sub` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selectedCat && topLevel.some(c => c.id === selectedCat.id) && (
          <div className="mt-3 bg-white rounded-xl border border-primary-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                  {selectedCat.icon ? <IconDisplay icon={selectedCat.icon} size={18} /> : <IconTag size={14} className="text-gray-400" />}
                </div>
                <span className="font-semibold text-gray-900">{selectedCat.name}</span>
                <span className="text-xs text-gray-400">{fmt(getCatSpent(selectedCat))}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); setSelectedCat(null) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <IconX size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {byParent(selectedCat.id).length > 0 ? byParent(selectedCat.id).map(sub => {
                const subSpent = spentByCategory[sub.id] || 0
                return (
                  <div key={sub.id} className="flex items-center gap-2 group py-1.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {sub.icon ? <IconDisplay icon={sub.icon} size={14} /> : <span className="text-gray-300 text-xs">·</span>}
                    </div>
                    <span className="text-sm text-gray-700 flex-1 truncate">{sub.name}</span>
                    <span className="text-sm font-medium text-gray-600">{fmt(subSpent)}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setModal(sub)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition">
                        <IconPencil size={12} />
                      </button>
                      <button onClick={() => remove(sub.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                        <IconTrash size={12} />
                      </button>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-xs text-gray-400 text-center py-2">Sin subcategorías</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm">Organizá tus ingresos y egresos</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <IconPlus size={16} /> Nueva categoría
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconTag size={40} className="mx-auto mb-3 opacity-30" />
          <p>Todavía no tenés categorías</p>
          <Button onClick={() => setModal({})} variant="secondary" className="mt-4">Crear primera categoría</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGrid('expense', 'Egresos', 'text-red-500')}
          {renderGrid('income', 'Ingresos', 'text-emerald-600')}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar categoría' : 'Nueva categoría'}
      >
        {modal && (
          <>
            <CategoryForm
              initial={modal?.id ? modal : null}
              parents={categories}
              paymentMethods={paymentMethods}
              lockAsParent={isEditingParent}
              onSave={save}
              onCancel={() => setModal(null)}
            />
            {isEditingParent && (
              <SubcategoriesManager
                parent={modal}
                categories={categories}
                user={user}
                onRefresh={reloadKeepingModal}
              />
            )}
          </>
        )}
      </Modal>

      {quickPay && (
        <QuickPayModal
          category={quickPay}
          onSave={handleQuickPay}
          onClose={() => setQuickPay(null)}
        />
      )}
    </div>
  )
}
