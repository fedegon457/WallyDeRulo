export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary:   'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-400 shadow-sm',
    secondary: 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    success:   'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400',
    accent:    'bg-accent text-gray-900 border-2 border-gray-900 hover:bg-yellow-300 focus:ring-yellow-400',
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
