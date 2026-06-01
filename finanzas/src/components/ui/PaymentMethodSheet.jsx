import { IconX } from '@tabler/icons-react'
import { IconDisplay } from './EmojiPicker'
import { buildPmGroups } from './CustomSelect'

export function PaymentMethodSheet({
  paymentMethods,
  value,
  onChange,
  onClose,
  title = 'Método de pago',
  allowEmpty = true,
}) {
  const groups = buildPmGroups(paymentMethods)

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-sm max-h-[72vh] flex flex-col shadow-2xl">

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <IconX size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => { onChange(''); onClose() }}
              className={`w-full text-left px-5 py-3 text-sm border-b border-gray-50 transition ${
                !value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              Sin especificar
            </button>
          )}

          {groups.map(g => (
            <div key={g.label}>
              <p className="px-5 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {g.label}
              </p>
              {g.options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); onClose() }}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                    value === o.value
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {o.icon && <IconDisplay icon={o.icon} size={18} />}
                  </span>
                  <span className="flex-1 text-left">{o.label}</span>
                  {value === o.value && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
