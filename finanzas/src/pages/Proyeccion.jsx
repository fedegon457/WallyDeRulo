import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoTransactions, demoRecurringExpenses } from '../lib/demoData'
import { IconDisplay } from '../components/ui/EmojiPicker'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts'
import {
  format, addMonths, startOfMonth, endOfMonth, subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function monthlyAmount(re) {
  if (re.frequency === 'monthly') return re.amount
  if (re.frequency === 'yearly')  return re.amount / 12
  if (re.frequency === 'weekly')  return (re.amount * 52) / 12
  return re.amount
}

export function Proyeccion() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [recurring,    setRecurring]    = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    if (isDemo(user)) {
      setTransactions(demoTransactions)
      setRecurring(demoRecurringExpenses.filter(r => r.is_active))
      setLoading(false)
      return
    }
    const from = format(startOfMonth(subMonths(new Date(), 3)), 'yyyy-MM-dd')
    Promise.all([
      supabase.from('transactions')
        .select('type, amount, date, transfer_group_id')
        .eq('user_id', user.id)
        .gte('date', from),
      supabase.from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]).then(([{ data: txs }, { data: res }]) => {
      setTransactions(txs ?? [])
      setRecurring(res ?? [])
      setLoading(false)
    })
  }, [user])

  const projection = useMemo(() => {
    // Historical: last 3 complete months
    const histMonths = [1, 2, 3].map(n => {
      const month = subMonths(new Date(), n)
      const from  = format(startOfMonth(month), 'yyyy-MM-dd')
      const to    = format(endOfMonth(month),   'yyyy-MM-dd')
      const txs   = transactions.filter(t =>
        !t.transfer_group_id && t.date >= from && t.date <= to
      )
      return {
        income:  txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })

    const avgIncome  = histMonths.reduce((s, m) => s + m.income,  0) / 3
    const avgExpense = histMonths.reduce((s, m) => s + m.expense, 0) / 3

    // Monthly recurring total
    const recurringMonthly = recurring.reduce((s, r) => s + monthlyAmount(r), 0)

    // Variable expenses = average total expenses minus recurring (floored at 0)
    const variableAvg = Math.max(avgExpense - recurringMonthly, 0)

    // Project 6 months forward
    let runningBalance = 0
    return Array.from({ length: 6 }, (_, i) => {
      const month    = addMonths(new Date(), i + 1)
      const label    = format(month, 'MMM yy', { locale: es })
      const income   = avgIncome
      const expense  = recurringMonthly + variableAvg
      const balance  = income - expense
      runningBalance += balance
      return { label, income, expense, balance, running: runningBalance, month }
    })
  }, [transactions, recurring])

  // Upcoming recurring expenses (next 30 days)
  const upcoming = useMemo(() => {
    const today    = new Date()
    const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const year     = today.getFullYear()
    const month    = today.getMonth()

    return recurring
      .filter(r => r.day_of_month)
      .map(r => {
        let d = new Date(year, month, r.day_of_month)
        if (d <= today) d = new Date(year, month + 1, r.day_of_month)
        return { ...r, nextDate: d }
      })
      .filter(r => r.nextDate <= in30days)
      .sort((a, b) => a.nextDate - b.nextDate)
  }, [recurring])

  const projectedMonthlyIncome  = projection[0]?.income  ?? 0
  const projectedMonthlyExpense = projection[0]?.expense ?? 0
  const projectedBalance        = projectedMonthlyIncome - projectedMonthlyExpense
  const recurringTotal = recurring.reduce((s, r) => s + monthlyAmount(r), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proyección de flujo</h1>
        <p className="text-gray-500 text-sm">Basado en tu historial y gastos fijos activos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ingresos proy./mes',  value: fmt(projectedMonthlyIncome),  color: 'text-emerald-600' },
          { label: 'Egresos proy./mes',   value: fmt(projectedMonthlyExpense),  color: 'text-red-500'     },
          { label: 'Balance mensual',     value: fmt(projectedBalance),          color: projectedBalance >= 0 ? 'text-primary-600' : 'text-orange-500' },
          { label: 'Gastos fijos/mes',    value: fmt(recurringTotal),            color: 'text-gray-700'    },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`font-bold text-base mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart: projected income vs expenses */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Ingresos vs egresos proyectados</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projection} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt(v)} />
            <Bar dataKey="income"  name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Egresos"  fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart: running balance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Balance acumulado proyectado</h2>
        <p className="text-xs text-gray-400 mb-4">Acumulado de ingresos − egresos a lo largo del tiempo</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={projection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt(v)} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={2} />
            <Line
              type="monotone" dataKey="running" name="Balance acumulado"
              stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Detalle por mes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {projection.map(m => {
            const positive = m.balance >= 0
            return (
              <div key={m.label} className="flex items-center px-5 py-3.5 gap-4">
                <p className="text-sm font-semibold text-gray-700 w-16 capitalize">{m.label}</p>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Ingresos</p>
                    <p className="text-sm font-semibold text-emerald-600">{fmt(m.income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Egresos</p>
                    <p className="text-sm font-semibold text-red-500">{fmt(m.expense)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className={`text-sm font-bold ${positive ? 'text-primary-600' : 'text-orange-500'}`}>
                      {positive ? '+' : ''}{fmt(m.balance)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming recurring expenses (next 30 days) */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Gastos fijos próximos 30 días</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.map(r => {
              const daysLeft = Math.ceil((r.nextDate - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {r.icon
                      ? <IconDisplay icon={r.icon} size={20} />
                      : <span className="text-base">📋</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">
                      {format(r.nextDate, "d 'de' MMMM", { locale: es })} · en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-500 flex-shrink-0">-{fmt(r.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Note about methodology */}
      <p className="text-xs text-gray-400 text-center pb-2">
        La proyección usa el promedio de ingresos/egresos de los últimos 3 meses más tus gastos fijos activos.
      </p>
    </div>
  )
}
