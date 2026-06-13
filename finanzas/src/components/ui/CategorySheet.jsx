import { useState } from 'react'
import { IconX, IconChevronDown, IconPlus } from '@tabler/icons-react'
import { IconDisplay, EmojiPicker } from './EmojiPicker'
import { supabase } from '../../lib/supabase'

export function CategorySheet({ categories, value, onChange, onClose, onCreateCategory, userId, type = 'expense' }) {
  const [expandedId, setExpandedId] = useState(() => {
    if (!value) return null
    const cat = categories.find(c => c.id === value)
    return cat?.parent_id ?? null
  })
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newIcon, setNewIcon]     = useState('')
  const [saving, setSaving]       = useState(false)

  const parents = categories.filter(c => !c.parent_id)

  const rows = []
  for (let i = 0; i < parents.length; i += 3) {
    rows.push(parents.slice(i, i + 3))
  }

  const handleParent = (cat) => {
    const children = categories.filter(c => c.parent_id === cat.id)
    if (children.length === 0) {
      onChange(cat.id)
      onClose()
    } else {
      setExpandedId(expandedId === cat.id ? null : cat.id)
    }
  }

  const handleChild = (cat) => {
    onChange(cat.id)
    onClose()
  }

  const handleCreate = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newName.trim(), icon: newIcon || null, type, user_id: userId, parent_id: null })
      .select('id, name, type, icon, parent_id')
      .single()
    if (!error && data) {
      onCreateCategory?.(data)
      onChange(data.id)
      onClose()
    }
    setSaving(false)
  }

  const cancelCreate = () => {
    setCreating(false)
    setNewName('')
    setNewIcon('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/85 backdrop-blur-2xl border border-white/40 w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md max-h-[75vh] sm:max-h-[80vh] flex flex-col shadow-2xl">
        <div className="w-10 h-1 bg-gray-400/40 rounded-full mx-auto mt-2.5 flex-shrink-0 sm:hidden" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Categoría</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <IconX size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {rows.map((row, rowIdx) => {
            const expandedInRow = row.find(p => p.id === expandedId)
            const children = expandedInRow
              ? categories.filter(c => c.parent_id === expandedInRow.id)
              : []

            return (
              <div key={rowIdx} className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {row.map(cat => {
                    const catChildren = categories.filter(c => c.parent_id === cat.id)
                    const isSelected = value === cat.id || catChildren.some(c => c.id === value)
                    const isExpanded = expandedId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleParent(cat)}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition border ${
                          isSelected
                            ? 'bg-primary-50 border-primary-200 text-primary-700'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl leading-none flex items-center justify-center w-8 h-8">
                          {cat.icon ? <IconDisplay icon={cat.icon} size={28} /> : '📋'}
                        </span>
                        <span className="text-xs font-medium text-gray-700 leading-tight mt-0.5">{cat.name}</span>
                        {catChildren.length > 0 && (
                          <IconChevronDown
                            size={11}
                            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>
                    )
                  })}
                  {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                </div>

                {children.length > 0 && (
                  <div className="ml-1 pl-3 border-l-2 border-primary-200">
                    <div className="grid grid-cols-3 gap-2">
                      {children.map(child => {
                        const isSelected = value === child.id
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleChild(child)}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition border ${
                              isSelected
                                ? 'bg-primary-50 border-primary-200 text-primary-700'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-2xl leading-none flex items-center justify-center w-8 h-8">
                              {child.icon ? <IconDisplay icon={child.icon} size={28} /> : '📋'}
                            </span>
                            <span className="text-xs font-medium text-gray-700 leading-tight mt-0.5">{child.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Crear nueva categoría — solo si se pasa onCreateCategory */}
          {onCreateCategory && (
            creating ? (
              <div className="mt-2 bg-primary-50 border border-primary-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <EmojiPicker value={newIcon} onChange={setNewIcon} compact />
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nombre de la categoría..."
                    className="flex-1 text-base border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelCreate}
                    className="flex-1 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim() || saving}
                    className="flex-1 py-1.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-40 transition"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full mt-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center gap-2 transition"
              >
                <IconPlus size={15} /> Nueva categoría
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
