import { useEffect, useState } from 'react'
import { IconPlus, IconPencil, IconTrash, IconPigMoney, IconCheck, IconX } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fmt } from '../lib/fmt'

const META_COLORS             = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#00C4B4']
const META_COLOR_CLASSES      = ['bg-green-500',    'bg-blue-500',    'bg-amber-500',    'bg-red-500',    'bg-violet-500',    'bg-cyan-500',    'bg-pink-500',    'bg-primary-500']
const META_COLOR_TINT_CLASSES = ['bg-green-500/20', 'bg-blue-500/20', 'bg-amber-500/20', 'bg-red-500/20', 'bg-violet-500/20', 'bg-cyan-500/20', 'bg-pink-500/20', 'bg-primary-500/20']
const META_TEXT_CLASSES       = ['text-green-500',  'text-blue-500',  'text-amber-500',  'text-red-500',  'text-violet-500',  'text-cyan-500',  'text-pink-500',  'text-primary-500']
const colorIdx = (hex) => { const i = META_COLORS.findIndex(c => c.toLowerCase() === hex?.toLowerCase()); return i >= 0 ? i : 0 }

const demoGoals = [
  { id: 'g1', user_id: 'demo', name: 'Vacaciones 2027',      target_amount: 500000,  current_amount: 125000,  color: '#3B82F6', deadline: '2027-01-15', created_at: '2026-01-01' },
  { id: 'g2', user_id: 'demo', name: 'Notebook nueva',       target_amount: 800000,  current_amount: 320000,  color: '#8B5CF6', deadline: null,          created_at: '2026-02-01' },
  { id: 'g3', user_id: 'demo', name: 'Fondo de emergencia',  target_amount: 1500000, current_amount: 1500000, color: '#22C55E', deadline: null,          created_at: '2025-06-01' },
]

function GoalForm({ initial, onSave, onCancel }) {
  const [name,     setName]     = useState(initial?.name           ?? '')
  const [target,   setTarget]   = useState(initial?.target_amount  ?? '')
  const [current,  setCurrent]  = useState(initial?.current_amount ?? 0)
  const [color,    setColor]    = useState(initial?.color          ?? '#22C55E')
  const [deadline, setDeadline] = useState(initial?.deadline       ?? '')
  const [saving,   setSaving]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      target_amount: parseFloat(target),
      current_amount: parseFloat(current) || 0,
      color,
      deadline: deadline || null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la meta</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Vacaciones, Notebook, Auto..."
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Objetivo</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
          <AmountInput
            value={target}
            onChange={setTarget}
            required
            placeholder="0"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ya ahorrado</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
          <AmountInput
            value={current}
            onChange={setCurrent}
            placeholder="0"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {META_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition flex items-center justify-center ${META_COLOR_CLASSES[i]} ${color === c ? 'border-gray-700' : 'border-transparent'}`}
            >
              {color === c && <IconCheck size={14} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha límite (opcional)</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-700"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

function AddFundsModal({ goal, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving]  = useState(false)
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const newAmount = Math.min(goal.current_amount + parseFloat(amount), goal.target_amount)
    await onSave(goal.id, newAmount)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Abonar a meta</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <IconX size={18} />
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-sm font-semibold text-gray-800">{goal.name}</p>
          <p className="text-xs text-gray-500">Falta: {fmt(remaining)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
            <AmountInput
              value={amount}
              onChange={setAmount}
              required
              autoFocus
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !amount}>
            {saving ? 'Guardando...' : 'Agregar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export function Metas() {
  const { user } = useAuth()
  const [goals,     setGoals]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [fundsGoal, setFundsGoal] = useState(null)

  const load = async () => {
    if (isDemo(user)) {
      setGoals([...demoGoals])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('savings_goals')
      .select('id, name, target_amount, current_amount, color, deadline, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (isDemo(user)) {
      if (modal?.id) {
        const idx = demoGoals.findIndex(g => g.id === modal.id)
        if (idx !== -1) Object.assign(demoGoals[idx], values)
      } else {
        demoGoals.unshift({ id: `g_${Date.now()}`, user_id: 'demo', created_at: new Date().toISOString(), ...values })
      }
      setModal(null)
      setGoals([...demoGoals])
      return
    }
    if (modal?.id) {
      await supabase.from('savings_goals').update(values).eq('id', modal.id).eq('user_id', user.id)
    } else {
      await supabase.from('savings_goals').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return
    if (isDemo(user)) {
      const idx = demoGoals.findIndex(g => g.id === id)
      if (idx !== -1) demoGoals.splice(idx, 1)
      setGoals([...demoGoals])
      return
    }
    await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user.id)
    load()
  }

  const updateFunds = async (id, newAmount) => {
    if (isDemo(user)) {
      const idx = demoGoals.findIndex(g => g.id === id)
      if (idx !== -1) demoGoals[idx].current_amount = newAmount
      setGoals([...demoGoals])
      return
    }
    await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', id).eq('user_id', user.id)
    load()
  }

  const active    = goals.filter(g => g.current_amount < g.target_amount)
  const completed = goals.filter(g => g.current_amount >= g.target_amount)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas de ahorro</h1>
          <p className="text-gray-500 text-sm">Seguí el progreso de tus objetivos</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <IconPlus size={16} /> Nueva
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Activas',    value: active.length,    color: 'text-primary-600' },
            { label: 'Cumplidas',  value: completed.length, color: 'text-emerald-600' },
            { label: 'Ahorrado',   value: fmt(goals.reduce((s, g) => s + g.current_amount, 0)), color: 'text-gray-900' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`font-bold text-base mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {active.map(g => {
        const ratio = g.target_amount > 0 ? g.current_amount / g.target_amount : 0
        const pct   = Math.round(ratio * 100)
        return (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${META_COLOR_TINT_CLASSES[colorIdx(g.color)]}`}>
                  <IconPigMoney size={22} className={META_TEXT_CLASSES[colorIdx(g.color)]} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{g.name}</p>
                  {g.deadline && (
                    <p className="text-xs text-gray-400">
                      Límite: {format(new Date(g.deadline), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFundsGoal(g)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition active:scale-95 ${META_COLOR_CLASSES[colorIdx(g.color)]}`}
                >
                  + Abonar
                </button>
                <button onClick={() => setModal(g)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition">
                  <IconPencil size={14} />
                </button>
                <button onClick={() => remove(g.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                  <IconTrash size={14} />
                </button>
              </div>
            </div>

            <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
              {/* GGA exception: dynamic percentage width requires inline style */}
              <div
                className={`h-full rounded-full transition-all duration-500 ${META_COLOR_CLASSES[colorIdx(g.color)]}`}
                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{fmt(g.current_amount)} ahorrado</span>
              <span className={`font-semibold ${META_TEXT_CLASSES[colorIdx(g.color)]}`}>{pct}%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Falta: {fmt(Math.max(g.target_amount - g.current_amount, 0))}</span>
              <span>Objetivo: {fmt(g.target_amount)}</span>
            </div>
          </div>
        )
      })}

      {completed.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cumplidas</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {completed.map(g => (
                <div key={g.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
                    <IconCheck size={18} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-400">{fmt(g.current_amount)} · Meta cumplida 🎉</p>
                  </div>
                  <button onClick={() => remove(g.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                    <IconTrash size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <IconPigMoney size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin metas de ahorro todavía</p>
          <button onClick={() => setModal({})} className="text-primary-600 text-sm mt-2 hover:underline">
            Crear la primera
          </button>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar meta' : 'Nueva meta'}>
        {modal && (
          <GoalForm
            initial={modal?.id ? modal : null}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {fundsGoal && (
        <AddFundsModal goal={fundsGoal} onSave={updateFunds} onClose={() => setFundsGoal(null)} />
      )}
    </div>
  )
}
