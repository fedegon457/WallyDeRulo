import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoCategories } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmojiPicker } from '../components/ui/EmojiPicker'

function CategoryForm({ initial, parents, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'expense')
  const [parentId, setParentId] = useState(initial?.parent_id ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [saving, setSaving] = useState(false)

  const filteredParents = parents.filter(p => !p.parent_id && p.type === type && p.id !== initial?.id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, type, parent_id: parentId || null, icon: icon || null })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => { setType('expense'); setParentId('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${type === 'expense' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500'}`}>
          Egreso
        </button>
        <button type="button" onClick={() => { setType('income'); setParentId('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${type === 'income' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-500'}`}>
          Ingreso
        </button>
      </div>
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Salud" />
      <EmojiPicker value={icon} onChange={setIcon} />
      <Select label="Categoría padre (opcional)" value={parentId} onChange={e => setParentId(e.target.value)}>
        <option value="">— Sin padre (categoría principal) —</option>
        {filteredParents.map(p => (
          <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
        ))}
      </Select>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

export function Categorias() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (isDemo(user)) { setCategories(demoCategories); setLoading(false); return }
    const { data } = await supabase
      .from('categories').select('*').eq('user_id', user.id)
      .order('type').order('parent_id', { nullsFirst: true }).order('name')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (modal.id) {
      await supabase.from('categories').update(values).eq('id', modal.id)
    } else {
      await supabase.from('categories').insert({ ...values, user_id: user.id })
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    const hasChildren = categories.some(c => c.parent_id === id)
    if (hasChildren) return alert('Esta categoría tiene subcategorías. Eliminá primero las subcategorías.')
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  const parents = categories.filter(c => !c.parent_id)
  const byParent = (parentId) => categories.filter(c => c.parent_id === parentId)

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
                  <span className="text-xl w-7 text-center">{cat.icon || <Tag size={16} className="text-gray-400" />}</span>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                  <span className="text-xs text-gray-400">({byParent(cat.id).length} subcategorías)</span>
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
                <div className="border-t border-gray-50 px-4 pb-2 pt-1 space-y-1">
                  {byParent(cat.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="text-base">{sub.icon || '·'}</span>
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar categoría' : 'Nueva categoría'}>
        {modal && (
          <CategoryForm
            initial={modal?.id ? modal : null}
            parents={categories}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
