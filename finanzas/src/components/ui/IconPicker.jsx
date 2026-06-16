import { useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import {
  dispColor, bgFromColor,
  MAIN_COLORS, ALL_COLORS,
  ICON_CATEGORIES, BRAND_SECTIONS,
} from '../../lib/iconData'
import { ICON_REGISTRY, BRAND_REGISTRY } from './EmojiPicker'

// ═══ VALUE FORMAT ══════════════════════════════════════════════════════════════
// "iconId:#hexColor"  e.g. "ph:house-duotone:#43A047"
// "IconName:#hexColor" legacy Tabler format (backward compat)

export function parseIconValue(value) {
  if (!value) return { iconId: '', color: null }
  const idx = value.indexOf(':#')
  if (idx !== -1) return { iconId: value.slice(0, idx), color: value.slice(idx + 1) }
  return { iconId: value, color: null }
}

export function buildIconValue(iconId, color) {
  if (!iconId) return ''
  return color ? `${iconId}:${color}` : iconId
}

// ═══ IconDisplay ═══════════════════════════════════════════════════════════════
// Renders any icon: ph:, simple-icons: (Iconify) or legacy Tabler "Icon" names

export function IconDisplay({ icon, size = 20, className = '', stroke = 1.5 }) {
  if (!icon) return null
  const { iconId, color } = parseIconValue(icon)

  // Iconify icons (ph: and simple-icons:)
  if (iconId.startsWith('ph:') || iconId.startsWith('simple-icons:')) {
    return (
      <Icon
        icon={iconId}
        width={size}
        height={size}
        className={className}
        style={color ? { color } : undefined}
      />
    )
  }

  // Legacy: Tabler icons
  if (iconId.startsWith('Icon')) {
    const TablerIcon = ICON_REGISTRY?.[iconId] || BRAND_REGISTRY?.[iconId]
    if (TablerIcon) {
      return (
        <TablerIcon
          size={size}
          stroke={stroke}
          className={className}
          style={color ? { color } : undefined}
        />
      )
    }
  }

  // Legacy: si: simple icons via CDN
  if (iconId.startsWith('si:')) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${iconId.slice(3)}`}
        width={size}
        height={size}
        className={className}
        alt={iconId.slice(3)}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }

  // Emoji / text fallback
  return <span style={/* GGA exception: dynamic em size from prop */ { fontSize: size * 0.85, lineHeight: 1 }} className={className}>{iconId}</span>
}

// ═══ IconCellPreview ═══════════════════════════════════════════════════════════
// The rounded square preview showing icon + tinted bg (same as picker cells)

export function IconCellPreview({ iconId, color, size = 40, className = '' }) {
  const bg = bgFromColor(color)
  const ic = dispColor(color)
  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 border-ink overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg, boxShadow: '2px 2px 0 #1a1a1a' }}
    >
      {/* GGA exception: size, bg and ic computed from icon value and color prop */}
      <Icon icon={iconId || 'ph:tag-duotone'} width={size * 0.52} height={size * 0.52} style={{ color: ic }} />
    </div>
  )
}

// ═══ IconPickerModal ══════════════════════════════════════════════════════════
// Full picker modal: color + icon/brand tabs — returns value on confirm

export function IconPickerModal({ value, onChange, onClose }) {
  const { iconId: initId, color: initColor } = parseIconValue(value)

  const [selColor, setSelColor] = useState(initColor || '#FFB500')
  const [selIcon,  setSelIcon]  = useState(initId  || 'ph:tag-duotone')
  const [colExp,   setColExp]   = useState(false)
  const [tab,      setTab]      = useState('icons')
  const [iconQ,    setIconQ]    = useState('')
  const [brandQ,   setBrandQ]   = useState('')

  const confirm = () => {
    onChange(buildIconValue(selIcon, selColor))
    onClose()
  }

  const filteredIcons = useCallback(() => {
    const q = iconQ.toLowerCase()
    if (!q) return ICON_CATEGORIES
    return ICON_CATEGORIES.map(g => ({
      ...g,
      ic: g.ic.filter(id => id.toLowerCase().includes(q)),
    })).filter(g => g.ic.length > 0)
  }, [iconQ])

  const filteredBrands = useCallback(() => {
    const q = brandQ.toLowerCase()
    if (!q) return BRAND_SECTIONS
    return BRAND_SECTIONS.map(s => ({
      ...s,
      items: s.items.filter(i => i.name.toLowerCase().includes(q)),
    })).filter(s => s.items.length > 0)
  }, [brandQ])

  const dc = dispColor(selColor)
  const bg = bgFromColor(selColor)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border-[2.5px] border-ink w-full sm:max-w-[400px] rounded-t-2xl sm:rounded-2xl shadow-[6px_6px_0_#1a1a1a] flex flex-col max-h-[92vh] overflow-hidden">

        {/* Chrome bar */}
        <div className="h-9 bg-[#FFB500] border-b-[2.5px] border-ink flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-black/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-black/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-black/10" />
          </div>
          <span className="font-mono text-[9px] tracking-[2px] text-black/30 uppercase">elegir ícono</span>
          <button onClick={onClose} className="text-black/30 hover:text-black/60 transition">
            <Icon icon="ph:x-bold" width={13} />
          </button>
        </div>

        {/* Preview row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
          {/* GGA exception: preview bg/color derived from user-selected color */}
          <div
            className="w-12 h-12 rounded-xl border-[2.5px] border-ink shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: bg }}
          >
            <Icon icon={selIcon} width={28} height={28} style={{ color: dc }} />
          </div>
          <div>
            <div className="text-[9px] font-bold tracking-[2px] text-gray-400 uppercase mb-0.5">Seleccionado</div>
            <div className="font-bold text-sm text-ink leading-tight">
              {selIcon.replace('ph:', '').replace('-duotone', '').replace('simple-icons:', '').replace(/-/g, ' ')}
            </div>
            <div className="font-mono text-[8px] text-gray-300 mt-0.5">{selIcon}</div>
          </div>
        </div>

        {/* Color section */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="text-[9px] font-bold tracking-[2px] text-gray-400 uppercase mb-2">Color</div>

          {colExp ? (
            <>
              <div className="grid grid-cols-11 gap-1 mb-1">
                {ALL_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelColor(c)}
                    className={`aspect-square w-full rounded-md border transition-transform ${
                      c === selColor
                        ? 'scale-[1.25] shadow-[0_0_0_2px_#1a1a1a] z-10 relative'
                        : 'border-black/10 hover:scale-110'
                    }`}
                    style={/* GGA exception: color swatch from ALL_COLORS data */ { background: c, borderColor: c === selColor ? undefined : 'rgba(0,0,0,0.12)' }}
                  />
                ))}
              </div>
              <button
                onClick={() => setColExp(false)}
                className="text-[9px] font-bold text-gray-300 hover:text-ink transition tracking-wide"
              >
                ↑ Ver menos
              </button>
            </>
          ) : (
            <div className="grid grid-cols-12 gap-1">
              {MAIN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelColor(c)}
                  className={`aspect-square w-full rounded-md border transition-transform ${
                    c === selColor
                      ? 'scale-[1.25] shadow-[0_0_0_2px_#1a1a1a] z-10 relative'
                      : 'border-black/10 hover:scale-110'
                  }`}
                  style={/* GGA exception: color swatch from MAIN_COLORS data */ { background: c }}
                />
              ))}
              <button
                onClick={() => setColExp(true)}
                className="aspect-square w-full rounded-md border border-dashed border-gray-300 flex items-center justify-center hover:border-[#FFB500] hover:bg-[#FFF8E0] transition"
              >
                <span className="text-[7px] font-black text-gray-400 leading-tight text-center">+55</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-100 mx-4 flex-shrink-0">
          {[['icons', 'Íconos'], ['brands', 'Marcas']].map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-[11px] font-bold border-b-[3px] -mb-[2px] transition ${
                tab === key ? 'border-[#006866] text-[#006866]' : 'border-transparent text-gray-300'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-2.5 pb-2 flex-shrink-0">
          <div className="relative">
            <Icon icon="ph:magnifying-glass-duotone" width={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={tab === 'icons' ? iconQ : brandQ}
              onChange={e => tab === 'icons' ? setIconQ(e.target.value) : setBrandQ(e.target.value)}
              placeholder={tab === 'icons' ? 'Buscar ícono...' : 'Buscar marca...'}
              className="w-full pl-8 pr-3 py-1.5 text-base border-[1.5px] border-gray-200 rounded-lg focus:border-[#006866] outline-none font-medium"
            />
          </div>
        </div>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
          {tab === 'icons' && (
            <div className="space-y-3">
              {filteredIcons().map(grp => (
                <div key={grp.s}>
                  <div className="text-[8.5px] font-black tracking-[1.5px] uppercase text-gray-300 mb-1.5 pb-1 border-b border-gray-50">
                    {grp.s}
                  </div>
                  <div className="grid grid-cols-9 gap-0.5">
                    {grp.ic.map(id => (
                      <button
                        key={id}
                        onClick={() => setSelIcon(id)}
                        title={id.replace('ph:', '').replace('-duotone', '').replace(/-/g, ' ')}
                        className={`aspect-square flex items-center justify-center rounded-lg border-[1.5px] transition ${
                          id === selIcon
                            ? 'bg-[#FFF3CC] border-ink shadow-[1.5px_1.5px_0_#1a1a1a]'
                            : 'border-transparent hover:bg-[#FFF8E0] hover:border-[#FFB500]'
                        }`}
                      >
                        <Icon icon={id} width={20} height={20} style={/* GGA exception: luminance-corrected icon color */ { color: dc }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'brands' && (
            <div className="space-y-4">
              {filteredBrands().map(section => (
                <div key={section.s}>
                  <div className="text-[8.5px] font-black tracking-[1.5px] uppercase text-gray-300 mb-2">
                    {section.s}
                  </div>
                  <div
                    className="grid gap-1.5"
                    style={/* GGA exception: dynamic column count per brand section */ { gridTemplateColumns: `repeat(${section.cols}, 1fr)` }}
                  >
                    {section.items.map(item => (
                      <button
                        key={item.id + item.name}
                        onClick={() => setSelIcon(item.id)}
                        className={`rounded-xl border-[1.5px] overflow-hidden transition-all ${
                          selIcon === item.id
                            ? 'border-ink shadow-[2px_2px_0_#1a1a1a]'
                            : 'border-gray-200 hover:border-ink hover:shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-px hover:-translate-y-px'
                        }`}
                      >
                        <div
                          className="h-11 flex items-center justify-center"
                          style={/* GGA exception: brand bg color from BRAND_SECTIONS data */ { background: item.bg }}
                        >
                          <Icon icon={item.id} width={24} height={24} style={{ color: item.ic }} />
                        </div>
                        <div className="py-1 px-1 bg-white border-t border-gray-100 text-[8px] font-bold text-gray-500 text-center truncate leading-tight">
                          {item.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — confirm */}
        <div className="px-4 py-3 border-t-2 border-gray-100 flex-shrink-0">
          <button
            onClick={confirm}
            className="w-full py-2.5 bg-ink text-[#FFB500] font-black text-[12px] rounded-full border-2 border-ink shadow-[3px_3px_0_rgba(0,0,0,0.12)] tracking-wide hover:-translate-y-px hover:shadow-[4px_4px_0_rgba(0,0,0,0.12)] transition-all font-['Space_Grotesk',sans-serif]"
          >
            Confirmar ícono
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══ IconPicker ═══════════════════════════════════════════════════════════════
// Compact trigger + optional inline label — drops a modal when clicked
// Drop-in replacement for the old EmojiPicker compact mode

export function IconPicker({ value, onChange, label, compact = false }) {
  const [open, setOpen] = useState(false)
  const { iconId, color } = parseIconValue(value)
  const bg   = color ? bgFromColor(color) : '#F5F5F5'
  const ic   = color ? dispColor(color)   : '#bbb'
  const isNew = !iconId

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-12 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 hover:border-primary-400 transition overflow-hidden"
          style={/* GGA exception: bg/color from stored icon value */ !isNew ? { background: bg } : {}}
        >
          {isNew
            ? <Icon icon="ph:plus-bold" width={16} className="text-gray-300" />
            : <Icon icon={iconId} width={22} height={22} style={{ color: ic }} />
          }
        </button>
        {open && (
          <IconPickerModal
            value={value}
            onChange={onChange}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-12 h-10 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition flex items-center justify-center overflow-hidden"
          style={/* GGA exception: bg/color from stored icon value */ !isNew ? { background: bg } : {}}
        >
          {isNew
            ? <Icon icon="ph:question-duotone" width={20} className="text-gray-300" />
            : <Icon icon={iconId} width={22} height={22} style={{ color: ic }} />
          }
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition font-medium ml-auto"
        >
          {open ? 'Cerrar' : 'Elegir ícono'}
        </button>
      </div>
      {open && (
        <IconPickerModal
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
