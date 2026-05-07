import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, Banknote } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoPaymentMethods } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const TYPE_LABELS = { immediate: 'Pago inmediato', credit: 'Tarjeta de crédito' }
const TYPE_ICONS = { immediate: Banknote, credit: CreditCard }
const TYPE_COLORS = { immediate: 'bg-emerald-100 text-emerald-700', credit: 'bg-blue-100 text-blue-700' }

function PaymentMethodForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'immediate')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, type })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Efectivo, Visa Santander..." />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Tipo de pago</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('immediate')}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${type === 'immediate' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <Banknote size={22} className={type === 'immediate' ? 'text-emerald-600' : 'text-gray-400'} />
            <span className={`text-xs font-medium ${type === 'immediate' ? 'text-emerald-700' : 'text-gray-500'}`}>Pago inmediato</span>
            <span className="text-xs text-gray-400 text-center">Efectivo, débito, transferencia</span>
          </button>
          <button
            type="button"
            onClick={() => setType('credit')}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${type === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <CreditCard size={22} className={type === 'credit' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`text-xs font-medium ${type === 'credit' ? 'text-blue-700' : 'text-gray-500'}`}>Tarjeta de crédito</span>
            <span className="text-xs text-gray-400 text-center">Se debita a futuro</span>
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

export function MetodosPago() {
  const { user } = useAuth()
  const [methods, setMethods] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (isDemo(user)) { setMethods(demoPaymentMethods); setLoading(false); return }
    const { data } = await supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name')
    setMethods(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (modal?.id) {
      await supabase.from('payment_methods').update(values).eq('id', modal.id)
    } else {
      await supabase.from('payment_methods').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar este método de pago?')) return
    await supabase.from('payment_methods').delete().eq('id', id)
    load()
  }

  const immediate = methods.filter(m => m.type === 'immediate')
  const credit = methods.filter(m => m.type === 'credit')

  const renderGroup = (list, type) => {
    if (list.length === 0) return null
    const Icon = TYPE_ICONS[type]
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{TYPE_LABELS[type]}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLORS[type]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{TYPE_LABELS[m.type]}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(m.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                  <Trash2 size={14} />
                </button>
              </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Métodos de pago</h1>
          <p className="text-gray-500 text-sm">Personalizá cómo registrás tus pagos</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <Plus size={16} /> Nuevo método
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>Todavía no tenés métodos de pago</p>
          <Button onClick={() => setModal({})} variant="secondary" className="mt-4">Crear primer método</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup(immediate, 'immediate')}
          {renderGroup(credit, 'credit')}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar método de pago' : 'Nuevo método de pago'}
      >
        {modal && (
          <PaymentMethodForm
            initial={modal?.id ? modal : null}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
