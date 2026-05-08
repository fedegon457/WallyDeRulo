import { useState } from 'react'
import { Search } from 'lucide-react'

const EMOJIS = {
  'Finanzas': ['💰','💵','💸','🏦','📈','💹','🪙','💎','🏧','📉','💳','🤑'],
  'Comida y bebida': ['🍕','🍔','🌮','🥗','🍱','🛒','🏪','☕','🍺','🍷','🧃','🍰','🥩','🍜','🥐'],
  'Salud': ['🏥','💊','💉','🩺','🧘','🏋️','🦷','👁️','🧠','❤️','🩹','🧬'],
  'Transporte': ['🚗','🚌','🚕','🛵','✈️','🚢','🚂','⛽','🅿️','🚲','🛺','🏍️'],
  'Hogar': ['🏠','🏡','💡','💧','🔧','🪴','🛋️','🧹','🪥','📦','🔑','🛏️'],
  'Tecnología': ['📱','💻','🖥️','⌨️','🖨️','📷','🎧','📺','🖱️','💾','📡'],
  'Entretenimiento': ['🎬','🎮','🎵','🎤','🎭','📚','🎨','⚽','🎂','🎁','🎯','🎲'],
  'Ropa y cuidado': ['👕','👟','💄','💇','💅','👔','🧴','🪒','👗','👠','🧢'],
  'Mascotas': ['🐕','🐈','🐠','🐹','🦜','🐾','🦮'],
  'Educación': ['📚','🎓','✏️','📝','🏫','🔬','📐','🖊️'],
  'Viajes': ['🏖️','🏔️','🗺️','🏕️','🗼','🌍','🎡','🏄','✈️','🏨'],
  'Trabajo': ['💼','🤝','⭐','🎯','🏆','📊','📋','🖥️','📌'],
  'Otros': ['📦','🔖','🎲','🌟','🔑','📌','🗂️','🧩','🪄','🌈','🔔'],
}

export const BRANDS = [
  // Streaming video
  { slug: 'netflix',       name: 'Netflix' },
  { slug: 'disneyplus',    name: 'Disney+' },
  { slug: 'primevideo',    name: 'Prime Video' },
  { slug: 'hbo',           name: 'Max / HBO' },
  { slug: 'appletv',       name: 'Apple TV+' },
  { slug: 'twitch',        name: 'Twitch' },
  { slug: 'crunchyroll',   name: 'Crunchyroll' },
  { slug: 'paramountplus', name: 'Paramount+' },
  // Streaming música
  { slug: 'spotify',       name: 'Spotify' },
  { slug: 'youtube',       name: 'YouTube' },
  { slug: 'applemusic',    name: 'Apple Music' },
  { slug: 'deezer',        name: 'Deezer' },
  { slug: 'soundcloud',    name: 'SoundCloud' },
  { slug: 'youtubemusic',  name: 'YT Music' },
  // Big tech
  { slug: 'google',        name: 'Google' },
  { slug: 'microsoft',     name: 'Microsoft' },
  { slug: 'apple',         name: 'Apple' },
  { slug: 'amazon',        name: 'Amazon' },
  { slug: 'meta',          name: 'Meta' },
  // Productividad
  { slug: 'github',        name: 'GitHub' },
  { slug: 'dropbox',       name: 'Dropbox' },
  { slug: 'notion',        name: 'Notion' },
  { slug: 'slack',         name: 'Slack' },
  { slug: 'zoom',          name: 'Zoom' },
  { slug: 'figma',         name: 'Figma' },
  { slug: 'adobe',         name: 'Adobe' },
  { slug: 'openai',        name: 'OpenAI' },
  { slug: 'canva',         name: 'Canva' },
  // Social
  { slug: 'instagram',     name: 'Instagram' },
  { slug: 'facebook',      name: 'Facebook' },
  { slug: 'x',             name: 'X (Twitter)' },
  { slug: 'tiktok',        name: 'TikTok' },
  { slug: 'whatsapp',      name: 'WhatsApp' },
  { slug: 'telegram',      name: 'Telegram' },
  { slug: 'discord',       name: 'Discord' },
  { slug: 'linkedin',      name: 'LinkedIn' },
  { slug: 'snapchat',      name: 'Snapchat' },
  { slug: 'reddit',        name: 'Reddit' },
  // Compras y delivery
  { slug: 'mercadopago',   name: 'Mercado Pago' },
  { slug: 'mercadolibre',  name: 'Mercado Libre' },
  { slug: 'uber',          name: 'Uber' },
  { slug: 'ubereats',      name: 'Uber Eats' },
  { slug: 'rappi',         name: 'Rappi' },
  { slug: 'airbnb',        name: 'Airbnb' },
  { slug: 'booking',       name: 'Booking' },
  // Gaming
  { slug: 'steam',         name: 'Steam' },
  { slug: 'playstation',   name: 'PlayStation' },
  { slug: 'xbox',          name: 'Xbox' },
  { slug: 'nintendo',      name: 'Nintendo' },
  { slug: 'epicgames',     name: 'Epic Games' },
  { slug: 'ea',            name: 'EA' },
  { slug: 'riotgames',     name: 'Riot Games' },
  { slug: 'ubisoft',       name: 'Ubisoft' },
  // Pagos y bancos internacionales
  { slug: 'paypal',        name: 'PayPal' },
  { slug: 'visa',          name: 'Visa' },
  { slug: 'mastercard',    name: 'Mastercard' },
  { slug: 'americanexpress', name: 'Amex' },
  { slug: 'santander',     name: 'Santander' },
  { slug: 'bbva',          name: 'BBVA' },
  { slug: 'hsbc',          name: 'HSBC' },
  { slug: 'itau',          name: 'Itaú' },
  // Ropa y deporte
  { slug: 'nike',          name: 'Nike' },
  { slug: 'adidas',        name: 'Adidas' },
  { slug: 'underarmour',   name: 'Under Armour' },
  // Telecom
  { slug: 'claro',         name: 'Claro' },
  { slug: 'movistar',      name: 'Movistar' },
  // Otros servicios
  { slug: 'duolingo',      name: 'Duolingo' },
  { slug: 'skillshare',    name: 'Skillshare' },
  { slug: 'udemy',         name: 'Udemy' },
  { slug: 'coursera',      name: 'Coursera' },
  { slug: 'icloud',        name: 'iCloud' },
  { slug: 'googledrive',   name: 'Google Drive' },
  { slug: 'googleone',     name: 'Google One' },
  { slug: 'microsoftazure', name: 'Azure' },
  { slug: 'chatgpt',       name: 'ChatGPT' },
]

// Renderiza cualquier ícono: emoji string o "si:slug" (Simple Icons)
export function IconDisplay({ icon, size = 20, className = '', dark = false }) {
  if (!icon) return null
  if (icon.startsWith('si:')) {
    const slug = icon.slice(3)
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}${dark ? '/ffffff' : ''}`}
        width={size}
        height={size}
        className={className}
        alt={slug}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }} className={className}>{icon}</span>
}

export function EmojiPicker({ value, onChange, label = 'Ícono', compact = false }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('emoji')
  const [search, setSearch] = useState('')

  const select = (icon) => { onChange(icon); setOpen(false); setSearch('') }

  const filteredBrands = search.trim()
    ? BRANDS.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.includes(search.toLowerCase())
      )
    : BRANDS

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {compact ? (
        // Modo compacto: solo el botón de ícono, sin texto extra
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-12 h-10 bg-gray-50 border-2 rounded-xl flex items-center justify-center hover:border-blue-400 transition ${open ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
          title="Elegir ícono"
        >
          {value
            ? <IconDisplay icon={value} size={22} />
            : <span className="text-gray-300 text-lg">＋</span>
          }
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-12 h-10 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 hover:border-blue-400 transition"
          >
            {value
              ? <IconDisplay icon={value} size={24} />
              : <span className="text-gray-300 text-xl">?</span>
            }
          </button>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              Quitar
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="ml-auto px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            {open ? 'Cerrar' : 'Elegir ícono'}
          </button>
        </div>
      )}

      {open && (
        <div className="border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden mt-1">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[['emoji', '😀 Emoji'], ['marca', '🏢 Marca']].map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setSearch('') }}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition ${
                  tab === key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {tab === 'emoji' && (
            <div className="p-3 max-h-60 overflow-y-auto space-y-2">
              {Object.entries(EMOJIS).map(([group, emojis]) => (
                <div key={group}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1">
                    {emojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => select(e)}
                        className={`w-9 h-9 text-xl rounded-lg hover:bg-blue-50 transition flex items-center justify-center ${
                          value === e ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'marca' && (
            <div className="p-3">
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar marca... (Netflix, Galicia, Spotify...)"
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
                {filteredBrands.map(b => {
                  const iconVal = `si:${b.slug}`
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => select(iconVal)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition ${
                        value === iconVal ? 'bg-blue-50 ring-2 ring-blue-400' : ''
                      }`}
                    >
                      <div className="w-7 h-7 flex items-center justify-center">
                        <img
                          src={`https://cdn.simpleicons.org/${b.slug}`}
                          width={24}
                          height={24}
                          alt={b.name}
                          onError={e => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.removeAttribute('hidden')
                            }
                          }}
                        />
                        <span hidden className="text-[10px] font-bold text-gray-400">
                          {b.name.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full">
                        {b.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              {filteredBrands.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
