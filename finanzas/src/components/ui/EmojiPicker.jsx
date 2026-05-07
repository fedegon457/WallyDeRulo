import { useState } from 'react'

const EMOJIS = {
  'Comida y bebida': ['🍕','🍔','🌮','🥗','🍱','🛒','🏪','☕','🍺','🍷','🧃','🍰'],
  'Salud': ['🏥','💊','💉','🩺','🧘','🏋️','🦷','👁️','🧠','❤️'],
  'Transporte': ['🚗','🚌','🚕','🛵','✈️','🚢','🚂','⛽','🅿️'],
  'Hogar': ['🏠','🏡','💡','💧','🔧','🪴','🛋️','🧹','🪥'],
  'Tecnología': ['📱','💻','🖥️','⌨️','🖨️','📷','🎧','📺'],
  'Entretenimiento': ['🎬','🎮','🎵','🎤','🎭','📚','🎨','⚽','🎂','🎁'],
  'Ropa y cuidado': ['👕','👟','💄','💇','💅','👔','🧴','🪒'],
  'Mascotas': ['🐕','🐈','🐠','🐹','🦜','🐾'],
  'Educación': ['📚','🎓','✏️','📝','🏫','💡'],
  'Ingresos': ['💼','💵','💰','🏦','📈','💹','🤝','⭐','🎯','🏆'],
  'Otros': ['📦','🔖','💳','🪙','🎲','🌟','🔑','📌','🗂️'],
}

export function EmojiPicker({ value, onChange }) {
  const [input, setInput] = useState(value || '')
  const [open, setOpen] = useState(false)

  const select = (emoji) => {
    setInput(emoji)
    onChange(emoji)
    setOpen(false)
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Ícono (emoji)</label>
      <div className="flex gap-2 items-center">
        <div className="w-12 h-10 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          {input || '?'}
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInput}
          placeholder="Pegá un emoji..."
          maxLength={4}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
        >
          {open ? 'Cerrar' : 'Elegir'}
        </button>
      </div>

      {open && (
        <div className="border border-gray-200 rounded-xl bg-white shadow-md p-3 space-y-3 max-h-64 overflow-y-auto">
          {Object.entries(EMOJIS).map(([group, emojis]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-400 mb-1.5">{group}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => select(e)}
                    className={`w-9 h-9 text-xl rounded-lg hover:bg-blue-50 transition flex items-center justify-center ${value === e ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
