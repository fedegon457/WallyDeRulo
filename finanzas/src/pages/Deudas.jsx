import { useEffect, useState } from 'react'
import { IconPlus, IconPencil, IconTrash, IconCheck, IconUsers } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fmt } from '../lib/fmt'

const demoDebts = [
  { id: 'd1', user_id: 'demo', person_name: 'Juan',   description: 'Cena cumpleaños',   amount: 15000, direction: 'lent',     date: '2026-05-15', paid: false, paid_at: null },
  { id: 'd2', user_id: 'demo', person_name: 'María',  description: 'Transfer por super', amount: 8500,  direction: 'borrowed', date: '2026-05-20', paid: false, paid_at: null },
  { id: 'd3', user_id: 'demo', person_name: 'Carlos', description: 'Entradas al cine',   amount: 12000, direction: 'lent',     date: '2026-04-10', paid: true,  paid_at: '2026-04-25' },
]

function DebtForm({ initial, onSave, onCancel }) {
  const [person,    setPerson]    = useState(initial?.person_name  ?? '')
  const [desc,      setDesc]      = useState(initial?.description  ?? '')
  const [amount,    setAmount]    = useState(initial?.amount       ?? '')
  const [direction, setDirection] = useState(initial?.direction    ?? 'lent')
  const [date,      setDate]      = useState(initial?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [saving,    setSaving]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ person_name: person, description: desc, amount: parseFloat(amount), direction, date })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[['lent', 'Presté'], ['borrowed', 'Me prestaron']].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setDirection(val)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
              direction === val
                ? val === 'lent'
                  ? 'bg-white shadow-sm text-emerald-600'
                  : 'bg-white shadow-sm text-red-600'
                : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {direction === 'lent' ? '¿A quién le prestaste?' : '¿Quién te prestó?'}
        </label>
        <input
          type="text"
          value={person}
          onChange={e => setPerson(e.target.value)}
          placeholder="Nombre..."
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Importe</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
          <AmountInput
            value={amount}
            onChange={setAmount}
            required
            placeholder="0"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (opcional)</label>
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="¿De qué se trata?"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
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

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

export function Deudas() {
  const { user } = useAuth()
  const [debts,    setDebts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [showPaid, setShowPaid] = useState(false)

  const load = async () => {
    if (isDemo(user)) {
      setDebts([...demoDebts])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('debts')
      .select('id, person_name, description, amount, direction, date, paid, paid_at')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setDebts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (isDemo(user)) {
      if (modal?.id) {
        const idx = demoDebts.findIndex(d => d.id === modal.id)
        if (idx !== -1) Object.assign(demoDebts[idx], values)
      } else {
        demoDebts.unshift({ id: `d_${Date.now()}`, user_id: 'demo', paid: false, paid_at: null, ...values })
      }
      setModal(null)
      setDebts([...demoDebts])
      return
    }
    if (modal?.id) {
      await supabase.from('debts').update(values).eq('id', modal.id).eq('user_id', user.id)
    } else {
      await supabase.from('debts').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const markPaid = async (id) => {
    if (isDemo(user)) {
      const idx = demoDebts.findIndex(d => d.id === id)
      if (idx !== -1) { demoDebts[idx].paid = true; demoDebts[idx].paid_at = format(new Date(), 'yyyy-MM-dd') }
      setDebts([...demoDebts])
      return
    }
    await supabase.from('debts').update({ paid: true, paid_at: format(new Date(), 'yyyy-MM-dd') }).eq('id', id).eq('user_id', user.id)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return
    if (isDemo(user)) {
      const idx = demoDebts.findIndex(d => d.id === id)
      if (idx !== -1) demoDebts.splice(idx, 1)
      setDebts([...demoDebts])
      return
    }
    await supabase.from('debts').delete().eq('id', id).eq('user_id', user.id)
    load()
  }

  const pending       = debts.filter(d => !d.paid)
  const paid          = debts.filter(d => d.paid)
  const totalLent     = pending.filter(d => d.direction === 'lent').reduce((s, d) => s + d.amount, 0)
  const totalBorrowed = pending.filter(d => d.direction === 'borrowed').reduce((s, d) => s + d.amount, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deudas y préstamos</h1>
          <p className="text-gray-500 text-sm">Llevá lo que debés y lo que te deben</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <IconPlus size={16} /> Nuevo
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs text-emerald-600 font-medium">Te deben</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{fmt(totalLent)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium">Debés</p>
            <p className="text-xl font-bold text-red-700 mt-0.5">{fmt(totalBorrowed)}</p>
          </div>
        </div>
      )}

      {pending.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {pending.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  d.direction === 'lent' ? 'bg-emerald-50' : 'bg-red-50'
                }`}>
                  <IconUsers size={16} className={d.direction === 'lent' ? 'text-emerald-500' : 'text-red-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{d.person_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      d.direction === 'lent'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {d.direction === 'lent' ? 'Te deben' : 'Debés'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {d.description && `${d.description} · `}
                    {format(new Date(d.date), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${
                  d.direction === 'lent' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {fmt(d.amount)}
                </span>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => markPaid(d.id)}
                    title="Marcar como saldado"
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-300 hover:text-emerald-500 transition"
                  >
                    <IconCheck size={14} />
                  </button>
                  <button onClick={() => setModal(d)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-primary-600 transition">
                    <IconPencil size={14} />
                  </button>
                  <button onClick={() => remove(d.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <IconUsers size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin deudas pendientes</p>
          <button onClick={() => setModal({})} className="text-primary-600 text-sm mt-2 hover:underline">
            Registrar una
          </button>
        </div>
      )}

      {paid.length > 0 && (
        <div>
          <button
            onClick={() => setShowPaid(v => !v)}
            className="text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition"
          >
            {showPaid ? '▼' : '▶'} Saldadas ({paid.length})
          </button>
          {showPaid && (
            <div className="mt-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {paid.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100">
                      <IconCheck size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 line-through">{d.person_name}</p>
                      <p className="text-xs text-gray-400">
                        {d.description && `${d.description} · `}
                        Saldado {d.paid_at && format(new Date(d.paid_at), "d MMM", { locale: es })}
                      </p>
                    </div>
                    <span className="font-medium text-sm text-gray-400 flex-shrink-0">{fmt(d.amount)}</span>
                    <button onClick={() => remove(d.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar registro' : 'Nuevo registro'}>
        {modal && (
          <DebtForm
            initial={modal?.id ? modal : null}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
