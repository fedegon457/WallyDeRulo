import { IconDisplay } from './EmojiPicker'
import { buildPmGroups } from './CustomSelect'
import { ChromeBar } from './ChromeBar'

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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-paper border-[2.5px] border-ink shadow-brutal overflow-hidden w-full rounded-t-2xl sm:rounded-2xl sm:max-w-sm max-h-[72vh] flex flex-col">
        <ChromeBar title={title} onClose={onClose} />

        <div className="overflow-y-auto flex-1">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => { onChange(''); onClose() }}
              className={`w-full text-left px-5 py-3 text-sm border-b border-gray-50 transition ${
                !value ? 'bg-[#FFF8E0] text-ink font-bold' : 'text-gray-400 hover:bg-[#FFF8E0]/60'
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
                      ? 'bg-[#FFF8E0] text-ink font-bold'
                      : 'text-gray-700 hover:bg-[#FFF8E0]/60'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {o.icon && <IconDisplay icon={o.icon} size={18} />}
                  </span>
                  <span className="flex-1 text-left">{o.label}</span>
                  {value === o.value && (
                    <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
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
