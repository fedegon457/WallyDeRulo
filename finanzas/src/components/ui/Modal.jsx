import { useEffect } from 'react'
import { ChromeBar } from './ChromeBar'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-paper border-[2.5px] border-ink shadow-brutal overflow-hidden rounded-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <ChromeBar title={title} onClose={onClose} />
        <div className="px-5 py-3 border-b border-ink/10">
          <h2 className="text-base font-black text-ink font-display">{title}</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  )
}
