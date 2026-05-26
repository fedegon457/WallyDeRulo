function fmtAmt(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const inputBase = 'w-full border-2 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition bg-white'

export function AmountInput({ label, error, className = '', value, onChange, ...props }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
    onChange(raw)
  }
  const el = (
    <input
      type="text"
      inputMode="numeric"
      value={fmtAmt(value)}
      onChange={handleChange}
      className={`${inputBase} ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'} ${className}`}
      {...props}
    />
  )
  if (!label) return el
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {el}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input
        className={`${inputBase} ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <select
        className={`${inputBase} ${error ? 'border-red-400' : 'border-gray-200'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <textarea
        className={`${inputBase} resize-none ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
