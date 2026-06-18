export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none'

  const variants = {
    primary:   'bg-ink text-gold hover:bg-ink/90 focus:ring-ink shadow-brutal-sm rounded-xl border-2 border-ink',
    secondary: 'bg-white text-ink border-2 border-ink hover:bg-[#FFF8E0] focus:ring-ink shadow-brutal-sm',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    success:   'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400',
    accent:    'bg-accent text-yellow-950 border-2 border-yellow-950 hover:bg-yellow-300 focus:ring-yellow-400',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
