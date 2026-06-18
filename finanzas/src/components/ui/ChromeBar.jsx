import { IconX } from '@tabler/icons-react'

export const ChromeBar = ({ title, onClose, actions, color = '#FFB500' }) => {
  return (
    <div
      className="h-9 border-b-[2.5px] border-ink flex items-center justify-between px-4 flex-shrink-0"
      style={{ /* GGA exception: color prop para variantes semánticas */ background: color }}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-black/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-black/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-black/10" />
      </div>

      {title && (
        <span className="font-mono text-[9px] tracking-[2px] text-black/30 uppercase absolute left-1/2 -translate-x-1/2">
          {title}
        </span>
      )}

      <div className="flex items-center gap-2">
        {actions}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-black/10 transition-colors"
            aria-label="Cerrar"
          >
            <IconX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
