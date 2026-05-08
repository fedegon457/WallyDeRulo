import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, Tag, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoCategories, demoPaymentMethods, demoCatAdd, demoCatUpdate, demoREAdd } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmojiPicker, IconDisplay } from '../components/ui/EmojiPicker'

const FREQ_LABELS = { monthly: 'Mensual', weekly: 'Semanal', yearly: 'Anual' }

// ─── Formulario ───────────────────────────────────────────────────────────────
function CategoryForm({ initial, parents, paymentMethods, onSave, onCancel }) {
  const [name, setName]           = useState(initial?.name ?? '')
  const [type, setType]           = useState(initial?.type ?? 'expense')
  const [isSub, setIsSub]         = useState(!!initial?.parent_id)
  const [parentId, setParentId]   = useState(initial?.parent_id ?? '')
  const [icon, setIcon]           = useState(initial?.icon ?? '')
  // Gasto fijo
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
        <EmojiPicker value={icon} onChange={setIcon} label="Ícono" compact />
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

      {/* Nivel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => handleIsSub(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${!isSub ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
            Principal
          </button>
          <button type="button" onClick={() => handleIsSub(true)}
            disabled={availableParents.length === 0}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${isSub ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'} disabled:opacity-40 disabled:cursor-not-allowed`}>
            Subcategoría
          </button>
        </div>
        {isSub && availableParents.length === 0 && (
          <p className="text-xs text-orange-500 mt-1.5">
            Creá primero una categoría principal de tipo {type === 'expense' ? 'Egreso' : 'Ingreso'}.
          </p>
        )}
      </div>

      {/* Categoría principal — chips */}
      {isSub && availableParents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría principal</label>
          <div className="flex flex-wrap gap-2">
            {availableParents.map(p => (
              <button key={p.id} type="button" onClick={() => setParentId(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                  parentId === p.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
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
      {type === 'expense' && (
        <div className={`rounded-xl border-2 transition-colors ${isFixed ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'}`}>
          <button
            type="button"
            onClick={() => setIsFixed(f => !f)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className={isFixed ? 'text-violet-600' : 'text-gray-400'} />
              <span className={`text-sm font-medium ${isFixed ? 'text-violet-700' : 'text-gray-600'}`}>
                ¿Es un gasto fijo o suscripción?
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${isFixed ? 'bg-violet-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFixed ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>

          {isFixed && (
            <div className="px-4 pb-4 space-y-3 border-t border-violet-100 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  placeholder="0"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 bg-white"
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
                  type="number"
                  min="1"
                  max="31"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">— Sin especificar —</option>
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-violet-600 bg-violet-100 rounded-lg px-3 py-2">
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
  const [loading, setLoading]             = useState(true)

  const load = async () => {
    if (isDemo(user)) {
      setCategories([...demoCategories])
      setPaymentMethods(demoPaymentMethods)
      setLoading(false)
      return
    }
    const [catRes, pmRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id)
        .order('type').order('parent_id', { nullsFirst: true }).order('name'),
      supabase.from('payment_methods').select('id, name').eq('user_id', user.id).order('name'),
    ])
    setCategories(catRes.data ?? [])
    setPaymentMethods(pmRes.data ?? [])
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
          demoREAdd({
            ...recurringData,
            id: `re_${Date.now()}`,
            user_id: 'demo',
            category_id: newCat.id,
          })
        }
        setCategories([...demoCategories])
      }
      setModal(null)
      return
    }

    if (modal?.id) {
      await supabase.from('categories').update(values).eq('id', modal.id)
      if (recurringData) {
        await supabase.from('recurring_expenses').insert({
          ...recurringData,
          category_id: modal.id,
          user_id: user.id,
        })
      }
    } else {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({ ...values, user_id: user.id })
        .select()
        .single()
      if (error) { alert(`Error: ${error.message}`); return }
      if (recurringData && newCat) {
        await supabase.from('recurring_expenses').insert({
          ...recurringData,
          category_id: newCat.id,
          user_id: user.id,
        })
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
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const parents   = categories.filter(c => !c.parent_id)
  const byParent  = (pid) => categories.filter(c => c.parent_id === pid)

  const renderGroup = (type, label, color) => {
    const topLevel = parents.filter(c => c.type === type)
    if (topLevel.length === 0) return null
    return (
      <div key={type}>
        <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color}`}>{label}</h3>
        <div className="space-y-2">
          {topLevel.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl w-7 text-center flex items-center justify-center">
                    {cat.icon
                      ? <IconDisplay icon={cat.icon} size={20} />
                      : <Tag size={16} className="text-gray-400" />
                    }
                  </span>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                  {byParent(cat.id).length > 0 && (
                    <span className="text-xs text-gray-400">({byParent(cat.id).length})</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(cat.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {byParent(cat.id).length > 0 && (
                <div className="border-t border-gray-50 px-4 pb-2 pt-1 space-y-0.5">
                  {byParent(cat.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="flex items-center">
                          {sub.icon
                            ? <IconDisplay icon={sub.icon} size={16} />
                            : <span className="text-gray-300">·</span>
                          }
                        </span>
                        {sub.name}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setModal(sub)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => remove(sub.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p>Todavía no tenés categorías</p>
          <Button onClick={() => setModal({})} variant="secondary" className="mt-4">Crear primera categoría</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup('expense', 'Egresos', 'text-red-500')}
          {renderGroup('income', 'Ingresos', 'text-emerald-600')}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar categoría' : 'Nueva categoría'}
      >
        {modal && (
          <CategoryForm
            initial={modal?.id ? modal : null}
            parents={categories}
            paymentMethods={paymentMethods}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
