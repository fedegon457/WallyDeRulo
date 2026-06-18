import { useEffect, useState, useMemo } from 'react'
import { IconPlus, IconPencil, IconTrash, IconTarget, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { CHART_COLORS } from '../lib/chartColors'
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
import { fmt } from '../lib/fmt'

function statusColor(ratio) {
  if (ratio >= 1)   return '#ef4444'
  if (ratio >= 0.8) return '#f59e0b'
  return '#10b981'
}

function RingProgress({ ratio, color, size = 56, strokeWidth = 6 }) {
  const stroke = color ?? statusColor(ratio)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(ratio, 1))
  const pct = Math.round(ratio * 100)
  return (
    <div className="relative flex-shrink-0" style={{ /* GGA exception: size is runtime-computed */ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ /* GGA exception: SVG stroke-dashoffset transition has no Tailwind equivalent */ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ /* GGA exception: ratio-derived color computed at runtime */ color: ratio >= 1 ? '#ef4444' : ratio >= 0.8 ? '#d97706' : '#374151' }}
      >
        {pct}%
      </span>
    </div>
  )
}

function ratioColor(ratio) {
  if (ratio >= 1)   return { bar: 'bg-red-500',     text: 'text-red-600',     light: 'bg-red-50',   border: 'border-red-200' }
  if (ratio >= 0.8) return { bar: 'bg-amber-400',   text: 'text-amber-600',   light: 'bg-amber-50', border: 'border-amber-200' }
  return              { bar: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' }
}

function ProgressBar({ spent, limit, thick = false }) {
  const ratio = limit > 0 ? spent / limit : 0
  const isOver = ratio >= 0.8
  const widthPct = Math.min(Math.round(ratio * 100), 100)
  return (
    <div className={`border border-ink/20 rounded-full overflow-hidden bg-white ${thick ? 'h-3' : 'h-1.5'}`}>
      <div
        className={`h-full rounded-full transition-all w-[${widthPct}%] ${isOver ? 'bg-red-500' : 'bg-gold'}`}
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
      supabase.from('budgets').select('id, amount, category_id').eq('user_id', user.id),
      supabase.from('categories').select('id, name, type, parent_id, icon').eq('user_id', user.id),
      supabase.from('transactions').select('type, amount, date, category_id, transfer_group_id')
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
      .filter(t => t.type === 'expense' && t.date >= monthStart && !t.transfer_group_id)
      .forEach(t => { if (t.category_id) map[t.category_id] = (map[t.category_id] || 0) + t.amount })
    return map
  }, [transactions, monthStart])

  const totalSpent = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && t.date >= monthStart && !t.transfer_group_id).reduce((s, t) => s + t.amount, 0),
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
      await supabase.from('budgets').update(values).eq('id', modal.id).eq('user_id', user.id)
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
    await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id)
    load()
  }

  const generalBudget   = budgets.find(b => !b.category_id)
  const categoryBudgets = budgets.filter(b => b.category_id)
  const totalCategoryBudget = categoryBudgets.reduce((s, b) => s + b.amount, 0)

  const [expandedBudgets, setExpandedBudgets] = useState(new Set())
  const toggleExpand = (id) => setExpandedBudgets(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

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
          <h1 className="font-display font-black text-ink text-2xl">Presupuestos</h1>
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
            <div className="flex items-center gap-4 mb-4">
              <RingProgress ratio={ratio} size={72} strokeWidth={7}
                color={ratio >= 1 ? '#ef4444' : ratio >= 0.8 ? '#f59e0b' : '#4ab8b8'}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <IconTarget size={14} className={text} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${text}`}>Presupuesto general</span>
                </div>
                <p className="text-2xl font-mono font-black text-ink">{fmt(spent)}</p>
                <p className="text-sm text-gray-500">de <span className="font-mono font-black">{fmt(generalBudget.amount)}</span> este mes</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
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

      {/* Distribución & Impacto */}
      {categoryBudgets.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-ink text-sm uppercase tracking-[2px] mb-3">Distribución &amp; Impacto</h2>

          {/* Stacked allocation bar */}
          {totalCategoryBudget > 0 && (
            <div className="mb-3 bg-paper rounded-2xl border-[2px] border-ink shadow-brutal-sm p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Distribución del presupuesto</p>
              <div className="h-3 rounded-full overflow-hidden flex">
                {categoryBudgets.map((b, i) => (
                  <div
                    key={b.id}
                    style={{ /* GGA exception: dynamic percentage width and chart palette color */ width: `${b.amount / totalCategoryBudget * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    className="h-full"
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                {categoryBudgets.map((b, i) => {
                  const cat = categories.find(c => c.id === b.category_id)
                  if (!cat) return null
                  return (
                    <div key={b.id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ /* GGA exception: identity dot color from chart palette */ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{cat.name} <span className="font-semibold">{Math.round(b.amount / totalCategoryBudget * 100)}%</span></span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-paper rounded-2xl border-[2px] border-ink shadow-brutal-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {categoryBudgets.map((b, i) => {
                const cat = categories.find(c => c.id === b.category_id)
                if (!cat) return null
                const spent = getSpent(b)
                const consumedRatio = b.amount > 0 ? spent / b.amount : 0
                const allocationPct = totalCategoryBudget > 0 ? b.amount / totalCategoryBudget * 100 : 0
                const { text } = ratioColor(consumedRatio)
                const color = CHART_COLORS[i % CHART_COLORS.length]
                const subCats = categories.filter(c => c.parent_id === b.category_id)
                const isExpanded = expandedBudgets.has(b.id)
                return (
                  <div key={b.id}>
                    <div className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <RingProgress ratio={consumedRatio} size={52} strokeWidth={5} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ /* GGA exception: identity dot color from dynamic chart palette */ backgroundColor: color }} />
                            <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                          </div>
                          <p className="text-xs text-gray-400 font-mono font-black">{fmt(spent)} <span className="text-gray-300 font-normal">de</span> {fmt(b.amount)}</p>
                          {/* Allocation bar — shows how big this budget is relative to others */}
                          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ /* GGA exception: color and width from dynamic data */ width: `${Math.min(allocationPct, 100)}%`, backgroundColor: color, opacity: 0.5 }} />
                          </div>
                          <span className="text-xs text-gray-400">{Math.round(allocationPct)}% del total presupuestado</span>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {subCats.length > 0 && (
                            <button onClick={() => toggleExpand(b.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                              {isExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                            </button>
                          )}
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
                    </div>
                    {/* Subcategory breakdown */}
                    {isExpanded && subCats.length > 0 && (
                      <div className="bg-gray-50 px-4 py-3 space-y-2.5 border-t border-gray-100">
                        {subCats.map(sub => {
                          const subSpent = spentByCategory[sub.id] || 0
                          const subRatio = b.amount > 0 ? subSpent / b.amount : 0
                          return (
                            <div key={sub.id}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  {sub.icon && <IconDisplay icon={sub.icon} size={12} />}
                                  <span className="text-xs text-gray-600">{sub.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{fmt(subSpent)}</span>
                              </div>
                              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full opacity-60"
                                  style={{ /* GGA exception: dynamic percentage width and category color from data */ width: `${Math.min(subRatio * 100, 100)}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
          <div className="bg-paper rounded-2xl border-[2px] border-ink shadow-brutal-sm overflow-hidden">
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
