import { useEffect, useState, useMemo } from 'react'
import { IconPlus, IconPencil, IconTrash, IconTarget } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import {
  demoBudgets, demoCategories, demoTransactions,
  demoBudgetAdd, demoBudgetUpdate, demoBudgetRemove,
} from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { AmountInput } from '../components/ui/Input'
import { IconDisplay } from '../components/ui/EmojiPicker'
import { format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function ratioColor(ratio) {
  if (ratio >= 1)   return { bar: 'bg-red-500',     text: 'text-red-600',     light: 'bg-red-50',   border: 'border-red-200' }
  if (ratio >= 0.8) return { bar: 'bg-amber-400',   text: 'text-amber-600',   light: 'bg-amber-50', border: 'border-amber-200' }
  return              { bar: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' }
}

function ProgressBar({ spent, limit, thick = false }) {
  const ratio = limit > 0 ? spent / limit : 0
  const { bar } = ratioColor(ratio)
  return (
    <div className={`bg-gray-100 rounded-full overflow-hidden ${thick ? 'h-3' : 'h-1.5'}`}>
      <div
        className={`h-full rounded-full transition-all ${bar}`}
        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
      />
    </div>
  )
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function BudgetForm({ initial, categories, budgets, onSave, onCancel }) {
  const hasGeneral = budgets.some(b => !b.category_id && b.id !== initial?.id)
  const startGeneral = initial ? !initial.category_id : !hasGeneral

  const [isGeneral, setIsGeneral]   = useState(startGeneral)
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [amount, setAmount]         = useState(initial?.amount ?? '')
  const [saving, setSaving]         = useState(false)

  const usedCatIds = new Set(budgets.filter(b => b.id !== initial?.id && b.category_id).map(b => b.category_id))
  const expenseCats = categories.filter(c => c.type === 'expense' && !c.parent_id && !usedCatIds.has(c.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isGeneral && !categoryId) return
    setSaving(true)
    await onSave({ category_id: isGeneral ? null : categoryId, amount: parseFloat(amount) })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
        <div className="flex gap-2">
          {[
            ['general', 'Presupuesto general', isGeneral],
            ['cat',     'Por categoría',       !isGeneral],
          ].map(([key, lbl, active]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setIsGeneral(key === 'general'); setCategoryId('') }}
              disabled={key === 'general' && hasGeneral}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                active
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {lbl}
            </button>
          ))}
        </div>
        {hasGeneral && isGeneral && (
          <p className="text-xs text-amber-500 mt-1.5">Ya tenés un presupuesto general. Editalo desde la lista.</p>
        )}
      </div>

      {/* Categoría chips */}
      {!isGeneral && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          {expenseCats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {expenseCats.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                    categoryId === c.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {c.icon && <IconDisplay icon={c.icon} size={14} />}
                  {c.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Todas las categorías ya tienen presupuesto asignado.</p>
          )}
        </div>
      )}

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Límite mensual</label>
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

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving || (!isGeneral && !categoryId)}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export function Presupuestos() {
  const { user } = useAuth()
  const [budgets, setBudgets]         = useState([])
  const [categories, setCategories]   = useState([])
  const [transactions, setTransactions] = useState([])
  const [modal, setModal]             = useState(null)
  const [loading, setLoading]         = useState(true)

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const mes = format(new Date(), 'MMMM yyyy', { locale: es })

  const load = async () => {
    if (isDemo(user)) {
      setBudgets([...demoBudgets])
      setCategories(demoCategories)
      setTransactions(demoTransactions)
      setLoading(false)
      return
    }
    const [budRes, catRes, txRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('type, amount, date, category_id')
        .eq('user_id', user.id).gte('date', monthStart),
    ])
    setBudgets(budRes.data ?? [])
    setCategories(catRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  // Gasto por categoría este mes
  const spentByCategory = useMemo(() => {
    const map = {}
    transactions
      .filter(t => t.type === 'expense' && t.date >= monthStart)
      .forEach(t => { if (t.category_id) map[t.category_id] = (map[t.category_id] || 0) + t.amount })
    return map
  }, [transactions, monthStart])

  const totalSpent = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && t.date >= monthStart).reduce((s, t) => s + t.amount, 0),
    [transactions, monthStart]
  )

  // Gasto de un presupuesto (suma subcategorías para categorías padre)
  const getSpent = (budget) => {
    if (!budget.category_id) return totalSpent
    const subIds = categories.filter(c => c.parent_id === budget.category_id).map(c => c.id)
    return [budget.category_id, ...subIds].reduce((s, id) => s + (spentByCategory[id] || 0), 0)
  }

  const save = async (values) => {
    if (isDemo(user)) {
      if (modal?.id) demoBudgetUpdate(modal.id, values)
      else demoBudgetAdd({ ...values, id: `bud_${Date.now()}`, user_id: 'demo' })
      setModal(null)
      setBudgets([...demoBudgets])
      return
    }
    if (modal?.id) {
      await supabase.from('budgets').update(values).eq('id', modal.id)
    } else {
      await supabase.from('budgets').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    if (isDemo(user)) {
      demoBudgetRemove(id)
      setBudgets([...demoBudgets])
      return
    }
    await supabase.from('budgets').delete().eq('id', id)
    load()
  }

  const generalBudget   = budgets.find(b => !b.category_id)
  const categoryBudgets = budgets.filter(b => b.category_id)

  // Categorías con gasto este mes pero sin presupuesto asignado
  const budgetedCatIds = new Set(categoryBudgets.map(b => b.category_id))
  const unbudgeted = categories.filter(c => {
    if (c.type !== 'expense' || c.parent_id || budgetedCatIds.has(c.id)) return false
    const subIds = categories.filter(s => s.parent_id === c.id).map(s => s.id)
    const spent = [c.id, ...subIds].reduce((s, id) => s + (spentByCategory[id] || 0), 0)
    return spent > 0
  })

  // Formulario inicial según el tipo de apertura
  const formInitial = modal?.id
    ? modal
    : modal?._prefillCat
      ? { category_id: modal._prefillCat }
      : null

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 text-sm capitalize">{mes}</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <IconPlus size={16} /> Nuevo
        </Button>
      </div>

      {/* Presupuesto general */}
      {generalBudget ? (() => {
        const spent = getSpent(generalBudget)
        const ratio = generalBudget.amount > 0 ? spent / generalBudget.amount : 0
        const { text, light, border } = ratioColor(ratio)
        return (
          <div className={`rounded-2xl border-2 ${border} ${light} p-5`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IconTarget size={15} className={text} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${text}`}>Presupuesto general</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{fmt(spent)}</p>
                <p className="text-sm text-gray-500 mt-0.5">de {fmt(generalBudget.amount)} este mes</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal(generalBudget)}
                  className="p-1.5 rounded-lg hover:bg-white/70 text-gray-400 hover:text-primary-600 transition">
                  <IconPencil size={14} />
                </button>
                <button onClick={() => remove(generalBudget.id)}
                  className="p-1.5 rounded-lg hover:bg-white/70 text-gray-400 hover:text-red-500 transition">
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
            <ProgressBar spent={spent} limit={generalBudget.amount} thick />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                {ratio >= 1
                  ? '⚠️ Límite superado'
                  : `Disponible: ${fmt(Math.max(generalBudget.amount - spent, 0))}`
                }
              </span>
              <span className={`text-xs font-bold ${text}`}>{Math.round(ratio * 100)}%</span>
            </div>
          </div>
        )
      })() : (
        <button
          onClick={() => setModal({})}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-primary-200 hover:text-primary-500 hover:bg-primary-50 transition flex items-center justify-center gap-2"
        >
          <IconTarget size={16} /> Agregar presupuesto general mensual
        </button>
      )}

      {/* Por categoría */}
      {categoryBudgets.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Por categoría</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {categoryBudgets.map(b => {
                const cat = categories.find(c => c.id === b.category_id)
                if (!cat) return null
                const spent = getSpent(b)
                const ratio = b.amount > 0 ? spent / b.amount : 0
                const { text } = ratioColor(ratio)
                return (
                  <div key={b.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {cat.icon
                            ? <IconDisplay icon={cat.icon} size={18} />
                            : <span className="text-sm">📋</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                          <p className="text-xs text-gray-400">{fmt(spent)} de {fmt(b.amount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${text}`}>{Math.round(ratio * 100)}%</span>
                        <button onClick={() => setModal(b)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-primary-600 transition">
                          <IconPencil size={13} />
                        </button>
                        <button onClick={() => remove(b.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                    <ProgressBar spent={spent} limit={b.amount} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sin presupuesto — categorías con gasto este mes */}
      {unbudgeted.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sin presupuesto asignado</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {unbudgeted.map(c => {
                const subIds = categories.filter(s => s.parent_id === c.id).map(s => s.id)
                const spent = [c.id, ...subIds].reduce((s, id) => s + (spentByCategory[id] || 0), 0)
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {c.icon ? <IconDisplay icon={c.icon} size={18} /> : <span className="text-sm">📋</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">Gastado este mes: {fmt(spent)}</p>
                    </div>
                    <button
                      onClick={() => setModal({ _prefillCat: c.id })}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap px-2 py-1 rounded-lg hover:bg-primary-50 transition"
                    >
                      + Asignar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {budgets.length === 0 && unbudgeted.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <IconTarget size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin presupuestos configurados</p>
          <button onClick={() => setModal({})} className="text-primary-600 text-sm mt-2 hover:underline">
            Crear el primero
          </button>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      >
        {modal && (
          <BudgetForm
            initial={formInitial}
            categories={categories}
            budgets={budgets}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
