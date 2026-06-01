import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { IconDisplay } from './EmojiPicker'

export const ACCOUNT_TYPE_LABELS = {
  bank:           'Banco',
  debit_card:     'Débito',
  credit_card:    'Crédito',
  savings:        'Ahorro',
  cash:           'Efectivo',
  digital_wallet: 'Billetera digital',
  e_payment:      'Pago electrónico',
  credit_line:    'Línea de crédito',
  investment:     'Inversión',
  other:          'Otro',
}

const ACCOUNT_TYPE_DEFAULT_ICON = {
  bank:           'IconBuildingBank:#6b7280',
  debit_card:     'IconCreditCard:#3B82F6',
  credit_card:    'IconCreditCard:#EF4444',
  savings:        'IconPigMoney:#22C55E',
  cash:           'IconCash:#6b7280',
  digital_wallet: 'IconDeviceMobile:#8B5CF6',
  e_payment:      'IconWallet:#14B8A6',
  credit_line:    'IconCashBanknote:#F97316',
  investment:     'IconTrendingUp:#22C55E',
  other:          'IconWallet:#6b7280',
}

const PM_GROUP_ORDER = ['bank','debit_card','credit_card','savings','cash','digital_wallet','e_payment','credit_line','investment','other']

export function buildCategoryGroups(categories, type = 'expense') {
  const topCats = categories.filter(c => c.type === type && !c.parent_id)
  const subcats  = categories.filter(c => c.type === type &&  c.parent_id)
  const groups = []
  const standalones = []

  topCats.forEach(parent => {
    const children = subcats.filter(c => c.parent_id === parent.id)
    if (children.length > 0) {
      groups.push({
        label: parent.name,
        options: children.map(c => ({ value: c.id, label: c.name, icon: c.icon || null })),
      })
    } else {
      standalones.push({ value: parent.id, label: parent.name, icon: parent.icon || null })
    }
  })

  if (standalones.length > 0) groups.unshift({ label: '', options: standalones })
  return groups
}

export function buildPmGroups(paymentMethods) {
  return PM_GROUP_ORDER
    .map(type => ({
      label: ACCOUNT_TYPE_LABELS[type] ?? type,
      options: paymentMethods
        .filter(m => m.account_type === type)
        .map(m => ({
          value: m.id,
          label: m.name,
          icon: m.icon || ACCOUNT_TYPE_DEFAULT_ICON[m.account_type] || null,
        })),
    }))
    .filter(g => g.options.length > 0)
}

export function CustomSelect({ label, value, onChange, options, groups, placeholder = '— Sin especificar —' }) {
  const [open, setOpen] = useState(false)

  const allOptions = groups ? groups.flatMap(g => g.options) : (options ?? [])
  const selected   = allOptions.find(o => o.value === value)
  const anyIcon    = allOptions.some(o => o.icon)

  const OptionBtn = ({ o }) => (
    <button
      type="button"
      onClick={() => { onChange(o.value); setOpen(false) }}
      className={`w-full text-left px-4 py-2 text-sm transition flex items-center gap-2.5 ${
        value === o.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {anyIcon && (
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {o.icon && <IconDisplay icon={o.icon} size={16} />}
        </span>
      )}
      <span className="flex-1 truncate">{o.label}</span>
    </button>
  )

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border rounded-xl text-sm bg-white transition text-left ${
          open ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-2.5 min-w-0 ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {anyIcon && (
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {selected?.icon && <IconDisplay icon={selected.icon} size={16} />}
            </span>
          )}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <IconChevronDown size={15} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9]" onClick={() => setOpen(false)} />
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition border-b border-gray-100 ${
                !value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {placeholder}
            </button>

            {groups
              ? groups.map((g, i) => g.options.length > 0 && (
                <div key={g.label || i}>
                  {g.label && (
                    <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {g.label}
                    </p>
                  )}
                  {g.options.map(o => <OptionBtn key={o.value} o={o} />)}
                </div>
              ))
              : allOptions.map(o => <OptionBtn key={o.value} o={o} />)
            }
          </div>
        </>
      )}
    </div>
  )
}
