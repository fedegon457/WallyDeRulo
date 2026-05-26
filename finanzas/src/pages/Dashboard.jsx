import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconTrendingUp, IconTrendingDown, IconWallet, IconArrowRight, IconArrowLeft, IconUsers, IconX } from '@tabler/icons-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoTransactions, demoSharedExpenses, demoRecurringExpenses } from '../lib/demoData'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { WelcomeModal } from '../components/ui/WelcomeModal'
import { OnboardingChecklist } from '../components/ui/OnboardingChecklist'
import { IconDisplay } from '../components/ui/EmojiPicker'

const COLORS = ['#00C4B4', '#FCCB30', '#22C55E', '#EF4444', '#F59E0B', '#06B6D4', '#EC4899', '#84CC16']

function PieSection({ data }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%" outerRadius={80}
          dataKey="value" paddingAngle={2}
          activeIndex={activeIdx}
          activeShape={(props) => (
            <Sector
              cx={props.cx} cy={props.cy}
              innerRadius={props.innerRadius}
              outerRadius={props.outerRadius + 8}
              startAngle={props.startAngle} endAngle={props.endAngle}
              fill={props.fill}
              style={{ filter: `drop-shadow(0px 4px 12px ${props.fill}99)` }}
            />
          )}
          onMouseEnter={(_, i) => setActiveIdx(i)}
          onMouseLeave={() => setActiveIdx(null)}
          style={{ cursor: 'pointer', outline: 'none' }}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0]
            const idx = data.findIndex(d => d.name === item.name)
            const color = COLORS[idx % COLORS.length]
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
            return (
              <div className="bg-white rounded-2xl shadow-xl border border-primary-100 px-4 py-3 min-w-[150px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{fmt(item.value)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{pct}% del total</p>
              </div>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function PersonDetailModal({ person, sharedExpenses, onClose }) {
  const owesMe = sharedExpenses
    .filter(e => e.paid_by_me !== false)
    .flatMap(e => (e.participants ?? [])
      .filter(p => p.name.toLowerCase() === person.name.toLowerCase())
      .map(p => {
        const paid = p.payments?.reduce((s, pay) => s + pay.amount, 0) ?? 0
        const pending = p.amount_owed - paid
        return pending > 0 ? { description: e.description, date: e.date, total: p.amount_owed, paid, pending } : null
      })
      .filter(Boolean)
    )

  const iOwe = sharedExpenses
    .filter(e => e.paid_by_me === false && e.paid_by_name?.toLowerCase() === person.name.toLowerCase() && !e.user_paid_back)
    .map(e => ({ description: e.description, date: e.date, amount: e.user_share ?? 0 }))

  const netBalance = person.pending - iOwe.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{person.name}</h2>
            <p className={`text-sm font-semibold ${netBalance > 0 ? 'text-amber-500' : netBalance < 0 ? 'text-primary-600' : 'text-emerald-600'}`}>
              {netBalance > 0 ? `Me debe ${fmt(netBalance)}` : netBalance < 0 ? `Debo ${fmt(Math.abs(netBalance))}` : 'Balance en cero'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><IconX size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {owesMe.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <IconArrowRight size={12} /> Me deben
              </p>
              <div className="space-y-2">
                {owesMe.map((item, i) => (
                  <div key={i} className="bg-amber-50 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400">{fmt(item.paid)} cobrado de {fmt(item.total)}</p>
                    </div>
                    <span className="font-bold text-amber-600 text-sm">{fmt(item.pending)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {iOwe.length > 0 && (
            <div>
              <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <IconArrowLeft size={12} /> Debo
              </p>
              <div className="space-y-2">
                {iOwe.map((item, i) => (
                  <div key={i} className="bg-primary-50 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400">{format(item.date ? new Date(item.date) : new Date(), 'dd/MM/yy')}</p>
                    </div>
                    <span className="font-bold text-primary-600 text-sm">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <Link to="/compartidos" onClick={onClose} className="flex items-center justify-center gap-2 text-sm text-primary-600 font-semibold hover:underline">
            Ver todos los gastos compartidos <IconArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ income: 0, expense: 0, byCategory: [] })
  const [recent, setRecent] = useState([])
  const [sharedExpenses, setSharedExpenses] = useState([])
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [recurringPayments, setRecurringPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [hasAccount, setHasAccount] = useState(false)
  const [hasBudget, setHasBudget] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)

  useEffect(() => {
    if (!user || isDemo(user)) return
    const welcomed = localStorage.getItem('wally_v1_welcomed')
    const checklistState = localStorage.getItem('wally_v1_checklist')
    if (!welcomed) {
      setShowWelcome(true)
    } else if (checklistState === 'visible') {
      setShowChecklist(true)
    }
  }, [user])

  const handleStartTour = () => {
    localStorage.setItem('wally_v1_welcomed', '1')
    localStorage.setItem('wally_v1_checklist', 'visible')
    setShowWelcome(false)
    setShowChecklist(true)
  }

  const handleDismissWelcome = () => {
    localStorage.setItem('wally_v1_welcomed', '1')
    setShowWelcome(false)
  }

  const handleDismissChecklist = () => {
    localStorage.setItem('wally_v1_checklist', 'dismissed')
    setShowChecklist(false)
  }

  useEffect(() => {
    if (!user) return
    const now = new Date()
    const from = format(startOfMonth(now), 'yyyy-MM-dd')
    const to = format(endOfMonth(now), 'yyyy-MM-dd')

    if (isDemo(user)) {
      const txs = demoTransactions.filter(t => t.date >= from && t.date <= to)
      const rec = [...demoTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const catMap = {}
      txs.filter(t => t.type === 'expense').forEach(t => {
        const n = t.categories?.name ?? 'Sin categoria'
        catMap[n] = (catMap[n] ?? 0) + t.amount
      })
      setData({ income, expense, byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })) })
      setRecent(rec)
      setSharedExpenses(demoSharedExpenses)
      setRecurringExpenses(demoRecurringExpenses)
      setRecurringPayments([])
      setHasAccount(true)
      setHasBudget(true)
      setLoading(false)
      return
    }

    const currentPeriod = format(new Date(), 'yyyy-MM')
    Promise.all([
      supabase.from('transactions').select('type, amount, categories(name, icon)').eq('user_id', user.id).gte('date', from).lte('date', to),
      supabase.from('transactions').select('id, type, amount, date, notes, categories(name, type, icon)').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('shared_expenses').select('*, participants:shared_expense_participants(*, payments:shared_expense_payments(*))').eq('user_id', user.id),
      supabase.from('recurring_expenses').select('*').eq('user_id', user.id).eq('is_active', true).order('name'),
      supabase.from('recurring_expense_payments').select('*').eq('user_id', user.id).eq('period', currentPeriod),
      supabase.from('payment_methods').select('id').eq('user_id', user.id).limit(1),
      supabase.from('budgets').select('id').eq('user_id', user.id).limit(1),
    ]).then(([{ data: txs }, { data: rec }, { data: shared }, { data: recurring }, { data: recPays }, { data: accts }, { data: budgets }]) => {
      const income = txs?.filter(t => t.type === 'income' && !t.transfer_group_id).reduce((s, t) => s + t.amount, 0) ?? 0
      const expense = txs?.filter(t => t.type === 'expense' && !t.transfer_group_id).reduce((s, t) => s + t.amount, 0) ?? 0
      const catMap = {}
      txs?.filter(t => t.type === 'expense' && !t.transfer_group_id).forEach(t => {
        const name = t.categories?.name ?? 'Sin categoria'
        catMap[name] = (catMap[name] ?? 0) + t.amount
      })
      setData({ income, expense, byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })) })
      setRecent(rec ?? [])
      setSharedExpenses(shared ?? [])
      setRecurringExpenses(recurring ?? [])
      setRecurringPayments(recPays ?? [])
      setHasAccount((accts?.length ?? 0) > 0)
      setHasBudget((budgets?.length ?? 0) > 0)
      setLoading(false)
    })
  }, [user])

  const mes = format(new Date(), 'MMMM yyyy', { locale: es })
  const balance = data.income - data.expense

  const completedSteps = {
    account:     hasAccount,
    transaction: recent.length > 0,
    recurring:   recurringExpenses.length > 0,
    budget:      hasBudget,
  }

  const debtMap = {}
  sharedExpenses.forEach(e => {
    (e.participants ?? []).forEach(p => {
      const paid = p.payments?.reduce((s, pay) => s + pay.amount, 0) ?? 0
      const pending = p.amount_owed - paid
      if (pending > 0) {
        if (!debtMap[p.name]) debtMap[p.name] = { name: p.name, pending: 0, count: 0 }
        debtMap[p.name].pending += pending
        debtMap[p.name].count += 1
      }
    })
  })
  const pendingDebts = Object.values(debtMap).sort((a, b) => b.pending - a.pending)
  const totalPendingDebt = pendingDebts.reduce((s, d) => s + d.pending, 0)

  const unpaidRecurring = recurringExpenses.filter(e => !recurringPayments.some(p => p.recurring_expense_id === e.id))
  const totalUnpaidRecurring = unpaidRecurring.reduce((s, e) => s + e.amount, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-5 space-y-5 max-w-5xl mx-auto">

      {/* Hero balance card */}
      <div className="bg-primary-500 rounded-2xl p-6 text-white border-2 border-primary-600">
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Balance del mes</p>
        <p className="text-4xl font-extrabold tracking-tight leading-none mb-2">{fmt(balance)}</p>
        <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold text-gray-900 border border-yellow-400 capitalize" style={{ backgroundColor: '#FCCB30' }}>{mes}</span>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="bg-white/15 rounded-xl p-3 border border-white/20">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Ingresos</p>
            <p className="text-white font-extrabold text-sm truncate">{fmt(data.income)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 border border-white/20">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Egresos</p>
            <p className="text-white font-extrabold text-sm truncate">{fmt(data.expense)}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 border border-white/20">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Me deben</p>
            <p className="text-white font-extrabold text-sm truncate">{fmt(totalPendingDebt)}</p>
          </div>
        </div>
      </div>

      {showChecklist && (
        <OnboardingChecklist completed={completedSteps} onDismiss={handleDismissChecklist} />
      )}

      {/* Charts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-primary-100/60 shadow-card p-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Egresos por categoria</h2>
          {data.byCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Sin egresos este mes</p>
            </div>
          ) : (
            <>
              <PieSection data={data.byCategory} />
              <div className="mt-3 space-y-2">
                {data.byCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-primary-100/60 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ultimas transacciones</h2>
            <Link to="/transacciones" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <IconArrowRight size={13} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Sin transacciones aun</p>
              <Link to="/transacciones" className="text-primary-600 text-sm mt-2 hover:underline font-semibold">Agregar una</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <IconDisplay icon={t.categories?.icon || (t.type === 'income' ? 'IconTrendingUp' : 'IconTrendingDown')} size={20} className={t.type === 'income' ? 'text-emerald-500' : 'text-red-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.notes || t.categories?.name || '-'}</p>
                    <p className="text-xs text-gray-400 font-medium">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingDebts.length > 0 && (
        <div className="bg-white rounded-3xl border border-primary-100/60 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Compartidos pendientes</h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingDebts.length}</span>
            </div>
            <Link to="/compartidos" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todos <IconArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingDebts.map((d, i) => (
              <button key={i} onClick={() => setSelectedPerson(d)}
                className="flex items-center gap-3 py-2.5 w-full text-left hover:bg-amber-50/60 rounded-2xl px-2 -mx-2 transition-colors">
                <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border border-amber-500">
                  {d.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{d.count} gasto{d.count !== 1 ? 's' : ''} pendiente{d.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-amber-600">{fmt(d.pending)}</span>
                  <IconArrowRight size={14} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Total pendiente</span>
            <span className="font-bold text-amber-600">{fmt(totalPendingDebt)}</span>
          </div>
        </div>
      )}

      {unpaidRecurring.length > 0 && (
        <div className="bg-white rounded-3xl border border-primary-100/60 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Fijos pendientes</h2>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unpaidRecurring.length}</span>
            </div>
            <Link to="/gastos-fijos" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todos <IconArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {unpaidRecurring.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1.5">
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <IconDisplay icon={e.icon || 'IconClipboard'} size={20} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                  {e.day_of_month && <p className="text-xs text-gray-400 font-medium">Vence dia {e.day_of_month}</p>}
                </div>
                <span className="text-sm font-bold text-red-500">{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Total pendiente</span>
            <span className="font-bold text-red-500">{fmt(totalUnpaidRecurring)}</span>
          </div>
        </div>
      )}

      {selectedPerson && (
        <PersonDetailModal person={selectedPerson} sharedExpenses={sharedExpenses} onClose={() => setSelectedPerson(null)} />
      )}

      {showWelcome && (
        <WelcomeModal onStartTour={handleStartTour} onDismiss={handleDismissWelcome} />
      )}
    </div>
  )
}
