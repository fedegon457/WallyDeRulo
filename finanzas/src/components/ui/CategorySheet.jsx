import { useState } from 'react'
import { Icon } from '@iconify/react'
import { IconDisplay } from './EmojiPicker'
import { IconPickerModal, parseIconValue, buildIconValue } from './IconPicker'
import { bgFromColor, dispColor } from '../../lib/iconData'
import { supabase } from '../../lib/supabase'

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({ cat, selected, expanded, onClick }) {
  const { iconId, color } = parseIconValue(cat.icon || '')
  const isIconify = iconId?.startsWith('ph:') || iconId?.startsWith('simple-icons:')
  const bg  = isIconify && color ? bgFromColor(color)  : '#F5F0E8'
  const ic  = isIconify && color ? dispColor(color)    : '#999'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all border-[1.5px] ${
        selected
          ? 'bg-primary-50 border-primary-400 shadow-sm'
          : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
      }`}
    >
      {/* GGA exception: icon bg derived from icon color from DB */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={isIconify && color ? { background: bg } : { background: '#F5F0E8' }}
      >
        {cat.icon
          ? <IconDisplay icon={cat.icon} size={24} />
          : <Icon icon="ph:tag-duotone" width={24} className="text-gray-300" />
        }
      </div>
      <span className="text-[11px] font-semibold text-gray-700 leading-tight line-clamp-2">{cat.name}</span>
      {/* Chevron if has children */}
      {cat._hasChildren && (
        <Icon
          icon="ph:caret-down-duotone"
          width={11}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  )
}

// ─── CreateForm ───────────────────────────────────────────────────────────────

function CreateForm({ type, userId, onCreated, onCancel }) {
  const [name,     setName]     = useState('')
  const [icon,     setIcon]     = useState('ph:tag-duotone:#FFB500')
  const [level,    setLevel]    = useState('parent')
  const [saving,   setSaving]   = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const { iconId, color } = parseIconValue(icon)
  const bg = bgFromColor(color || '#FFB500')
  const ic = dispColor(color || '#FFB500')

  const handleSave = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name:      name.trim(),
        icon:      icon || null,
        type,
        user_id:   userId,
        parent_id: null,
      })
      .select('id, name, type, icon, parent_id')
      .single()

    if (!error && data) onCreated?.(data)
    setSaving(false)
  }

  return (
    <>
      {/* Preview + trigger */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-14 h-14 rounded-xl border-[2px] border-ink shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center flex-shrink-0 transition-all hover:-translate-y-px overflow-hidden"
          style={{ background: bg }} /* GGA exception: icon bg/color computed from stored icon value */
        >
          <Icon icon={iconId || 'ph:tag-duotone'} width={30} height={30} style={{ color: ic }} />
        </button>
        <div className="flex-1">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Nombre de la categoría…"
            className="w-full text-base font-semibold border-[1.5px] border-gray-200 rounded-xl px-3 py-2.5 focus:border-primary-400 outline-none bg-white transition"
          />
          <p className="text-[10px] text-gray-400 mt-1 pl-1">Tocá el ícono para cambiarlo</p>
        </div>
      </div>

      {/* Level toggle */}
      <div className="grid grid-cols-2 border-[1.5px] border-gray-200 rounded-xl overflow-hidden mb-4">
        {[['parent', 'Principal'], ['sub', 'Subcategoría']].map(([v, lbl]) => (
          <button
            key={v}
            type="button"
            onClick={() => setLevel(v)}
            className={`py-2 text-[11px] font-bold transition ${
              level === v ? 'bg-[#FFF8E0] text-ink' : 'text-gray-400'
            } ${v === 'sub' ? 'border-l border-gray-200' : ''}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm text-gray-500 border-[1.5px] border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="flex-1 py-2.5 text-sm font-black text-[#FFB500] bg-ink border-[1.5px] border-ink rounded-xl disabled:opacity-40 transition shadow-[2px_2px_0_rgba(0,0,0,0.12)] hover:-translate-y-px"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {pickerOpen && (
        <IconPickerModal
          value={icon}
          onChange={setIcon}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}

// ─── CategorySheet ────────────────────────────────────────────────────────────

export function CategorySheet({ categories, value, onChange, onClose, onCreateCategory, userId, type = 'expense' }) {
  const [expandedId, setExpandedId] = useState(() => {
    if (!value) return null
    const cat = categories.find(c => c.id === value)
    return cat?.parent_id ?? null
  })
  const [creating, setCreating] = useState(false)

  // Enrich parents with _hasChildren flag
  const parents = categories
    .filter(c => !c.parent_id)
    .map(p => ({ ...p, _hasChildren: categories.some(c => c.parent_id === p.id) }))

  const rows = []
  for (let i = 0; i < parents.length; i += 3) rows.push(parents.slice(i, i + 3))

  const handleParent = (cat) => {
    const children = categories.filter(c => c.parent_id === cat.id)
    if (children.length === 0 || expandedId === cat.id) {
      onChange(cat.id)
      onClose()
    } else {
      setExpandedId(cat.id)
    }
  }

  const handleCreated = (cat) => {
    onCreateCategory?.(cat)
    onChange(cat.id)
    onClose()
  }

  const typeLabel = type === 'expense' ? 'Egreso'  : 'Ingreso'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border-[2.5px] border-ink w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md max-h-[82vh] flex flex-col shadow-[6px_6px_0_#1a1a1a] overflow-hidden">

        {/* Chrome bar */}
        <div className="h-9 bg-[#FFB500] border-b-[2.5px] border-ink flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-black/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-black/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-black/10" />
          </div>
          <span className="font-mono text-[9px] tracking-[2px] text-black/30 uppercase">categoría</span>
          <button onClick={onClose} className="text-black/30 hover:text-black/60 transition">
            <Icon icon="ph:x-bold" width={13} />
          </button>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2.5 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-black text-ink text-base">Categoría</h3>
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
              type === 'expense' ? 'bg-[#FFECEC] text-[#CC2200]' : 'bg-[#E8FAF5] text-[#006866]'
            }`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {creating ? (
            <CreateForm
              type={type}
              userId={userId}
              onCreated={handleCreated}
              onCancel={() => setCreating(false)}
            />
          ) : (
            <>
              <div className="space-y-2">
                {rows.map((row, rowIdx) => {
                  const expandedInRow = row.find(p => p.id === expandedId)
                  const children = expandedInRow
                    ? categories.filter(c => c.parent_id === expandedInRow.id)
                    : []

                  return (
                    <div key={rowIdx} className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {row.map(cat => (
                          <CategoryCard
                            key={cat.id}
                            cat={cat}
                            selected={value === cat.id || categories.some(c => c.parent_id === cat.id && c.id === value)}
                            expanded={expandedId === cat.id}
                            onClick={() => handleParent(cat)}
                          />
                        ))}
                        {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => <div key={i} />)}
                      </div>

                      {children.length > 0 && (
                        <div className="ml-1 pl-3 border-l-2 border-primary-200">
                          <div className="grid grid-cols-3 gap-2">
                            {children.map(child => (
                              <CategoryCard
                                key={child.id}
                                cat={child}
                                selected={value === child.id}
                                expanded={false}
                                onClick={() => { onChange(child.id); onClose() }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {onCreateCategory && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full mt-3 py-3 border-[2px] border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center gap-2 transition"
                >
                  <Icon icon="ph:plus-bold" width={14} />
                  Nueva categoría
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
