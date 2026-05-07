import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight, ArrowLeft, Users, X, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoTransactions, demoSharedExpenses, demoRecurringExpenses } from '../lib/demoData'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function StatCard({ label, amount, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{amount}</p>
    </div>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function calcPending(expense) {
  return expense.participants?.reduce((s, p) => {
    const paid = p.payments?.reduce((ps, pay) => ps + pay.amount, 0) ?? 0
    return s + Math.max(0, p.amount_owed - paid)
  }, 0) ?? 0
}

function PersonDetailModal({ person, sharedExpenses, onClose }) {
  // Gastos donde me debe
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

  // Gastos donde le debo
  const iOwe = sharedExpenses
    .filter(e => e.paid_by_me === false && e.paid_by_name?.toLowerCase() === person.name.toLowerCase() && !e.user_paid_back)
    .map(e => ({ description: e.description, date: e.date, amount: e.user_share ?? 0 }))

  const netBalance = person.pending - iOwe.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{person.name}</h2>
            <p className={`text-sm font-medium ${netBalance > 0 ? 'text-orange-500' : netBalance < 0 ? 'text-purple-600' : 'text-emerald-600'}`}>
              {netBalance > 0 ? `Me debe ${fmt(netBalance)}` : netBalance < 0 ? `Debo ${fmt(Math.abs(netBalance))}` : 'Balance en cero ✓'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {owesMe.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <ArrowRight size={12} /> Me deben
              </p>
              <div className="space-y-2">
                {owesMe.map((item, i) => (
                  <div key={i} className="bg-orange-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400">{fmt(item.paid)} cobrado de {fmt(item.total)}</p>
                    </div>
                    <span className="font-bold text-orange-600 text-sm">{fmt(item.pending)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {iOwe.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <ArrowLeft size={12} /> Debo
              </p>
              <div className="space-y-2">
                {iOwe.map((item, i) => (
                  <div key={i} className="bg-purple-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400">{fmt(item.date ? new Date(item.date) : new Date(), 'dd/MM/yy')}</p>
                    </div>
                    <span className="font-bold text-purple-600 text-sm">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t">
          <Link to="/compartidos" onClick={onClose} className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline">
            Ver todos los gastos compartidos <ArrowRight size={14} />
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
        const n = t.categories?.name ?? 'Sin categoría'
        catMap[n] = (catMap[n] ?? 0) + t.amount
      })
      setData({ income, expense, byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })) })
      setRecent(rec)
      setSharedExpenses(demoSharedExpenses)
      setRecurringExpenses(demoRecurringExpenses)
      setRecurringPayments([])
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
    ]).then(([{ data: txs }, { data: rec }, { data: shared }, { data: recurring }, { data: recPays }]) => {
      const income = txs?.filter(t => t.type === 'income' && !t.transfer_group_id).reduce((s, t) => s + t.amount, 0) ?? 0
      const expense = txs?.filter(t => t.type === 'expense' && !t.transfer_group_id).reduce((s, t) => s + t.amount, 0) ?? 0
      const catMap = {}
      txs?.filter(t => t.type === 'expense' && !t.transfer_group_id).forEach(t => {
        const name = t.categories?.name ?? 'Sin categoría'
        catMap[name] = (catMap[name] ?? 0) + t.amount
      })
      setData({ income, expense, byCategory: Object.entries(catMap).map(([name, value]) => ({ name, value })) })
      setRecent(rec ?? [])
      setSharedExpenses(shared ?? [])
      setRecurringExpenses(recurring ?? [])
      setRecurringPayments(recPays ?? [])
      setLoading(false)
    })
  }, [user])

  const mes = format(new Date(), 'MMMM yyyy', { locale: es })
  const balance = data.income - data.expense

  // Agrupar por nombre de persona y acumular lo pendiente
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
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm capitalize">{mes}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Ingresos del mes" amount={fmt(data.income)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Egresos del mes" amount={fmt(data.expense)} icon={TrendingDown} color="bg-red-500" />
        <StatCard label="Balance" amount={fmt(balance)} icon={Wallet} color={balance >= 0 ? 'bg-blue-600' : 'bg-orange-500'} />
        <StatCard label="Me deben" amount={fmt(totalPendingDebt)} icon={Users} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Egresos por categoría</h2>
          {data.byCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Sin egresos este mes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.byCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Últimas transacciones</h2>
            <Link to="/transacciones" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Sin transacciones aún</p>
              <Link to="/transacciones" className="text-blue-600 text-sm mt-2 hover:underline">Agregar una</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {t.categories?.icon || (t.type === 'income' ? '💰' : '💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.notes || t.categories?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{format(new Date(t.date), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingDebts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Gastos compartidos pendientes</h2>
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingDebts.length}
              </span>
            </div>
            <Link to="/compartidos" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingDebts.map((d, i) => (
              <button key={i} onClick={() => setSelectedPerson(d)}
                className="flex items-center gap-3 py-2.5 w-full text-left hover:bg-amber-50 rounded-lg px-2 -mx-2 transition">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">👤</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.count} gasto{d.count !== 1 ? 's' : ''} pendiente{d.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-amber-600">{fmt(d.pending)}</span>
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total pendiente</span>
            <span className="font-bold text-amber-600">{fmt(totalPendingDebt)}</span>
          </div>
        </div>
      )}

      {unpaidRecurring.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Gastos fijos pendientes</h2>
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unpaidRecurring.length}
              </span>
            </div>
            <Link to="/gastos-fijos" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {unpaidRecurring.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1.5">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {e.icon || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{e.name}</p>
                  {e.day_of_month && <p className="text-xs text-gray-400">Vence día {e.day_of_month}</p>}
                </div>
                <span className="text-sm font-bold text-red-500">{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total pendiente</span>
            <span className="font-bold text-red-500">{fmt(totalUnpaidRecurring)}</span>
          </div>
        </div>
      )}

      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          sharedExpenses={sharedExpenses}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  )
}
