import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoTransactions, demoCategories } from '../lib/demoData'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Sector, Legend
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function SectionTitle({ children }) {
  return <h2 className="text-base font-semibold text-gray-900 mb-4">{children}</h2>
}

function PieSection({ data }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data} cx="50%" cy="50%" outerRadius={85}
          dataKey="value" paddingAngle={2}
          activeIndex={activeIdx}
          activeShape={(props) => (
            <Sector
              cx={props.cx} cy={props.cy}
              innerRadius={props.innerRadius}
              outerRadius={props.outerRadius + 10}
              startAngle={props.startAngle} endAngle={props.endAngle}
              fill={props.fill}
              style={{ filter: `drop-shadow(0px 4px 12px ${props.fill}aa)` }}
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
            const pct = ((item.value / total) * 100).toFixed(1)
            return (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
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

export function Reportes() {
  const { user } = useAuth()
  const [transactions,    setTransactions]    = useState([])
  const [categories,      setCategories]      = useState([])
  const [loading,         setLoading]         = useState(true)
  const [period, setPeriod] = useState('6')

  useEffect(() => {
    if (!user) return
    if (isDemo(user)) {
      setTransactions(demoTransactions)
      setCategories(demoCategories)
      setLoading(false)
      return
    }
    Promise.all([
      supabase.from('transactions').select('*, categories(name, type, parent_id)').eq('user_id', user.id).order('date'),
      supabase.from('categories').select('*').eq('user_id', user.id),
    ]).then(([{ data: txs }, { data: cats }]) => {
      setTransactions(txs ?? [])
      setCategories(cats ?? [])
      setLoading(false)
    })
  }, [user])

  const months = eachMonthOfInterval({
    start: startOfMonth(subMonths(new Date(), parseInt(period) - 1)),
    end: endOfMonth(new Date()),
  })

  const monthlyData = months.map(month => {
    const from = format(startOfMonth(month), 'yyyy-MM-dd')
    const to = format(endOfMonth(month), 'yyyy-MM-dd')
    const txs = transactions.filter(t => t.date >= from && t.date <= to)
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return {
      mes: format(month, 'MMM yy', { locale: es }),
      Ingresos: income,
      Egresos: expense,
      Balance: income - expense,
    }
  })

  const expensesByCategory = (() => {
    const from = format(startOfMonth(subMonths(new Date(), parseInt(period) - 1)), 'yyyy-MM-dd')
    const map = {}
    transactions
      .filter(t => t.type === 'expense' && t.date >= from)
      .forEach(t => {
        const cat = t.categories
        let label = cat?.name ?? 'Sin categoría'
        if (cat?.parent_id) {
          const parent = categories.find(c => c.id === cat.parent_id)
          if (parent) label = parent.name
        }
        map[label] = (map[label] ?? 0) + t.amount
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  })()

  const incomeByCategory = (() => {
    const from = format(startOfMonth(subMonths(new Date(), parseInt(period) - 1)), 'yyyy-MM-dd')
    const map = {}
    transactions
      .filter(t => t.type === 'income' && t.date >= from)
      .forEach(t => {
        const cat = t.categories
        let label = cat?.name ?? 'Sin categoría'
        if (cat?.parent_id) {
          const parent = categories.find(c => c.id === cat.parent_id)
          if (parent) label = parent.name
        }
        map[label] = (map[label] ?? 0) + t.amount
      })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  })()

  const totalIncome = monthlyData.reduce((s, m) => s + m.Ingresos, 0)
  const totalExpense = monthlyData.reduce((s, m) => s + m.Egresos, 0)
  const avgIncome = totalIncome / months.length
  const avgExpense = totalExpense / months.length

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm">Analizá tus finanzas</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[['3', '3 meses'], ['6', '6 meses'], ['12', '1 año']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${period === val ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total ingresos', value: fmt(totalIncome), color: 'text-emerald-600' },
          { label: 'Total egresos', value: fmt(totalExpense), color: 'text-red-500' },
          { label: 'Prom. ingresos/mes', value: fmt(avgIncome), color: 'text-primary-600' },
          { label: 'Prom. egresos/mes', value: fmt(avgExpense), color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`font-bold text-base mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Ingresos vs Egresos por mes</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Legend />
            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle>Balance mensual</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Egresos por categoría</SectionTitle>
          {expensesByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin egresos en el período</p>
          ) : (
            <PieSection data={expensesByCategory} />
          )}
          <div className="mt-3 space-y-1.5">
            {expensesByCategory.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-700">{cat.name}</span>
                </div>
                <span className="font-medium text-gray-900">{fmt(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle>Ingresos por categoría</SectionTitle>
          {incomeByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin ingresos en el período</p>
          ) : (
            <PieSection data={incomeByCategory} />
          )}
          <div className="mt-3 space-y-1.5">
            {incomeByCategory.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-700">{cat.name}</span>
                </div>
                <span className="font-medium text-gray-900">{fmt(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
