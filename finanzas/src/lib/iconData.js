// ═══ COLOR UTILITIES ═══════════════════════════════════════════════════════════

export function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  let h, s, l = (mx + mn) / 2
  if (mx === mn) { h = s = 0 } else {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

export function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  const hue = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 0.5) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return '#' + [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)]
    .map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

// Corrects icon color for very light palette colors so it stays visible
export function dispColor(hex) {
  if (!hex || hex.length < 7) return hex
  const [h, s, l] = hexToHsl(hex)
  if (l > 65) return hslToHex(h, Math.min(95, s > 5 ? s + 15 : 40), Math.max(22, l - 52))
  return hex
}

// Derives a soft tinted background from the selected color
export function bgFromColor(hex) {
  if (!hex || hex.length < 7) return '#FFF8E0'
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s > 5 ? s * 0.2 : 8, Math.max(l, 90))
}

export function isLightColor(hex) {
  return hexToHsl(hex)[2] > 65
}

// ═══ COLOR PALETTE (11 families × 6 shades = 66 colors) ═══════════════════════

export const MAIN_COLORS = [
  '#E53935', '#FB8C00', '#FFB500', '#43A047', '#00ACC1',
  '#1E88E5', '#5E35B1', '#8E24AA', '#E91E63', '#795548', '#757575',
]

export const ALL_COLORS = [
  // Rojo
  '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E53935', '#C62828', '#B71C1C',
  // Naranja
  '#FFF3E0', '#FFE0B2', '#FFCC80', '#FB8C00', '#EF6C00', '#E65100',
  // Dorado
  '#FFFDE7', '#FFF9C4', '#FFF176', '#FDD835', '#FFB500', '#F57F17',
  // Verde
  '#F1F8E9', '#DCEDC8', '#A5D6A7', '#43A047', '#2E7D32', '#1B5E20',
  // Teal
  '#E0F7FA', '#B2EBF2', '#80DEEA', '#00ACC1', '#00838F', '#006064',
  // Azul
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#1E88E5', '#1565C0', '#0D47A1',
  // Violeta
  '#EDE7F6', '#D1C4E9', '#9575CD', '#5E35B1', '#4527A0', '#311B92',
  // Púrpura
  '#F3E5F5', '#E1BEE7', '#CE93D8', '#8E24AA', '#6A1B9A', '#4A148C',
  // Rosa
  '#FCE4EC', '#F8BBD0', '#F48FB1', '#E91E63', '#C2185B', '#880E4F',
  // Tierra
  '#EFEBE9', '#D7CCC8', '#A1887F', '#795548', '#5D4037', '#3E2723',
  // Gris
  '#FAFAFA', '#F5F5F5', '#BDBDBD', '#757575', '#424242', '#212121',
]

// ═══ ICON CATEGORIES (ph: Phosphor Duotone) ════════════════════════════════════

export const ICON_CATEGORIES = [
  { s: 'Finanzas & Dinero', ic: ['ph:wallet-duotone','ph:currency-dollar-duotone','ph:coins-duotone','ph:piggy-bank-duotone','ph:bank-duotone','ph:credit-card-duotone','ph:receipt-duotone','ph:trend-up-duotone','ph:trend-down-duotone','ph:chart-bar-duotone','ph:chart-line-up-duotone','ph:percent-duotone','ph:calculator-duotone','ph:handshake-duotone','ph:invoice-duotone','ph:currency-eur-duotone','ph:arrows-left-right-duotone','ph:currency-bitcoin-duotone'] },
  { s: 'Comida & Bebida', ic: ['ph:fork-knife-duotone','ph:coffee-duotone','ph:pizza-duotone','ph:hamburger-duotone','ph:cake-duotone','ph:cocktail-duotone','ph:wine-duotone','ph:beer-bottle-duotone','ph:cooking-pot-duotone','ph:knife-duotone','ph:fish-duotone','ph:leaf-duotone','ph:carrot-duotone','ph:orange-slice-duotone','ph:bowl-food-duotone','ph:egg-duotone','ph:cup-duotone','ph:candy-duotone'] },
  { s: 'Transporte & Movilidad', ic: ['ph:bus-duotone','ph:car-duotone','ph:train-duotone','ph:airplane-duotone','ph:bicycle-duotone','ph:motorcycle-duotone','ph:taxi-duotone','ph:boat-duotone','ph:truck-duotone','ph:gas-pump-duotone','ph:map-pin-duotone','ph:airplane-landing-duotone','ph:airplane-takeoff-duotone','ph:anchor-duotone','ph:car-simple-duotone'] },
  { s: 'Hogar & Casa', ic: ['ph:house-duotone','ph:couch-duotone','ph:bed-duotone','ph:bathtub-duotone','ph:lamp-duotone','ph:wrench-duotone','ph:broom-duotone','ph:plant-duotone','ph:key-duotone','ph:door-duotone','ph:hammer-duotone','ph:fire-duotone','ph:drop-duotone','ph:lightning-duotone','ph:thermometer-duotone','ph:fan-duotone','ph:shower-duotone'] },
  { s: 'Salud & Bienestar', ic: ['ph:heart-duotone','ph:first-aid-duotone','ph:bandaids-duotone','ph:pill-duotone','ph:syringe-duotone','ph:stethoscope-duotone','ph:tooth-duotone','ph:eye-duotone','ph:baby-duotone','ph:dumbbell-duotone','ph:barbell-duotone','ph:brain-duotone','ph:sneaker-duotone','ph:heartbeat-duotone','ph:hand-heart-duotone','ph:microscope-duotone'] },
  { s: 'Ocio & Entretenimiento', ic: ['ph:film-strip-duotone','ph:music-notes-duotone','ph:game-controller-duotone','ph:television-duotone','ph:book-open-duotone','ph:ticket-duotone','ph:confetti-duotone','ph:star-duotone','ph:guitar-duotone','ph:headphones-duotone','ph:camera-duotone','ph:microphone-duotone','ph:dice-five-duotone','ph:popcorn-duotone','ph:vinyl-record-duotone','ph:books-duotone','ph:globe-duotone','ph:map-trifold-duotone'] },
  { s: 'Ropa & Compras', ic: ['ph:t-shirt-duotone','ph:handbag-duotone','ph:shopping-cart-duotone','ph:shopping-bag-duotone','ph:tag-duotone','ph:sunglasses-duotone','ph:crown-duotone','ph:gift-duotone','ph:watch-duotone','ph:ring-duotone','ph:dress-duotone','ph:sneaker-duotone','ph:pants-duotone','ph:sock-duotone'] },
  { s: 'Educación & Ciencia', ic: ['ph:graduation-cap-duotone','ph:pencil-duotone','ph:pen-duotone','ph:notepad-duotone','ph:backpack-duotone','ph:chalkboard-duotone','ph:atom-duotone','ph:flask-duotone','ph:microscope-duotone','ph:ruler-duotone','ph:clipboard-duotone','ph:certificate-duotone','ph:compass-tool-duotone','ph:newspaper-duotone'] },
  { s: 'Tecnología & Digital', ic: ['ph:device-mobile-duotone','ph:laptop-duotone','ph:desktop-tower-duotone','ph:wifi-duotone','ph:battery-full-duotone','ph:cloud-duotone','ph:code-duotone','ph:monitor-duotone','ph:printer-duotone','ph:cpu-duotone','ph:bluetooth-duotone','ph:keyboard-duotone','ph:mouse-duotone','ph:robot-duotone','ph:hard-drive-duotone','ph:qr-code-duotone'] },
  { s: 'Viajes & Turismo', ic: ['ph:suitcase-rolling-duotone','ph:map-duotone','ph:compass-duotone','ph:umbrella-duotone','ph:tent-duotone','ph:mountains-duotone','ph:globe-hemisphere-west-duotone','ph:passport-duotone','ph:map-trifold-duotone','ph:sailboat-duotone','ph:lighthouse-duotone'] },
  { s: 'Deportes & Gym', ic: ['ph:barbell-duotone','ph:basketball-duotone','ph:tennis-ball-duotone','ph:football-duotone','ph:bicycle-duotone','ph:person-simple-run-duotone','ph:medal-duotone','ph:trophy-duotone','ph:golf-duotone','ph:baseball-duotone'] },
  { s: 'Mascotas', ic: ['ph:paw-print-duotone','ph:dog-duotone','ph:cat-duotone','ph:bird-duotone','ph:fish-simple-duotone','ph:rabbit-duotone','ph:horse-duotone','ph:butterfly-duotone','ph:bone-duotone'] },
  { s: 'Trabajo & Negocio', ic: ['ph:briefcase-duotone','ph:buildings-duotone','ph:calendar-duotone','ph:clock-duotone','ph:phone-duotone','ph:envelope-duotone','ph:presentation-chart-bar-duotone','ph:target-duotone','ph:user-tie-duotone','ph:files-duotone','ph:folder-open-duotone','ph:seal-check-duotone','ph:chart-pie-duotone','ph:funnel-duotone'] },
  { s: 'Social & Familia', ic: ['ph:users-duotone','ph:user-circle-duotone','ph:baby-duotone','ph:gift-duotone','ph:hand-heart-duotone','ph:chats-duotone','ph:heart-straight-duotone','ph:smiley-duotone','ph:balloon-duotone','ph:cake-duotone','ph:sparkle-duotone'] },
  { s: 'Servicios & Utilities', ic: ['ph:lightning-duotone','ph:drop-duotone','ph:flame-duotone','ph:phone-call-duotone','ph:television-duotone','ph:wifi-duotone','ph:receipt-duotone','ph:shield-duotone','ph:lock-duotone','ph:bell-duotone','ph:radio-duotone','ph:recycle-duotone','ph:trash-duotone','ph:gear-six-duotone'] },
  { s: 'Varios', ic: ['ph:star-duotone','ph:heart-duotone','ph:sparkle-duotone','ph:sun-duotone','ph:moon-duotone','ph:cloud-sun-duotone','ph:rainbow-duotone','ph:planet-duotone','ph:alien-duotone','ph:robot-duotone','ph:magic-wand-duotone','ph:diamond-duotone','ph:flag-duotone','ph:smiley-wink-duotone','ph:question-duotone','ph:seal-duotone'] },
]

// ═══ BRAND DATA (simple-icons: vectorizado monocromo + ph: fallback) ══════════
// Cada entrada: { id, ic (icon color), bg (background tint), name }

export const BRAND_SECTIONS = [
  { s: 'Tarjetas', cols: 5, items: [
    { id: 'simple-icons:visa',            ic: '#1434CB', bg: '#EEF2FF', name: 'Visa' },
    { id: 'simple-icons:mastercard',      ic: '#EB001B', bg: '#FFF0F0', name: 'Mastercard' },
    { id: 'simple-icons:americanexpress', ic: '#016FD0', bg: '#EEF6FF', name: 'AMEX' },
    { id: 'ph:credit-card-duotone',       ic: '#007AC0', bg: '#E8EEFF', name: 'Cabal' },
    { id: 'ph:credit-card-duotone',       ic: '#FF6200', bg: '#FFF3E0', name: 'Naranja X' },
  ]},
  { s: 'Billeteras digitales AR', cols: 4, items: [
    { id: 'simple-icons:mercadopago',     ic: '#009EE3', bg: '#E8F6FF', name: 'Mercado Pago' },
    { id: 'simple-icons:paypal',          ic: '#003087', bg: '#EEF2FF', name: 'PayPal' },
    { id: 'ph:device-mobile-duotone',     ic: '#22C55E', bg: '#EDFFF5', name: 'Ualá' },
    { id: 'ph:qr-code-duotone',           ic: '#FF5500', bg: '#FFF3E0', name: 'MODO' },
    { id: 'ph:bank-duotone',              ic: '#060E26', bg: '#EEEEFF', name: 'Brubank' },
    { id: 'ph:device-mobile-duotone',     ic: '#6D28D9', bg: '#EDE7F6', name: 'Personal Pay' },
    { id: 'ph:leaf-duotone',              ic: '#5A8000', bg: '#F5FDE8', name: 'Lemon Cash' },
    { id: 'ph:lightning-duotone',         ic: '#E85B12', bg: '#FFF0E8', name: 'Bind' },
  ]},
  { s: 'Bancos argentinos', cols: 4, items: [
    { id: 'ph:bank-duotone', ic: '#B71C1C', bg: '#FFF0F0', name: 'Galicia' },
    { id: 'ph:bank-duotone', ic: '#004A97', bg: '#EEF2FF', name: 'BBVA' },
    { id: 'ph:bank-duotone', ic: '#EC0000', bg: '#FFF0F0', name: 'Santander' },
    { id: 'ph:bank-duotone', ic: '#DB0011', bg: '#FFF0F0', name: 'HSBC' },
    { id: 'ph:bank-duotone', ic: '#005CA9', bg: '#EEF2FF', name: 'Macro' },
    { id: 'ph:bank-duotone', ic: '#003F87', bg: '#EEF2FF', name: 'Bco. Nación' },
    { id: 'ph:bank-duotone', ic: '#1B5E20', bg: '#EDFFF5', name: 'Provincia' },
    { id: 'ph:bank-duotone', ic: '#CC0000', bg: '#FFF0F0', name: 'ICBC' },
    { id: 'ph:bank-duotone', ic: '#00538B', bg: '#EEF2FF', name: 'Bco. Ciudad' },
    { id: 'ph:bank-duotone', ic: '#5C0500', bg: '#FFF0F0', name: 'Bancor' },
    { id: 'ph:buildings-duotone', ic: '#0085C7', bg: '#EEF2FF', name: 'Comafi' },
    { id: 'ph:buildings-duotone', ic: '#8B0000', bg: '#FFF0F0', name: 'Patagonia' },
  ]},
  { s: 'Métodos de pago', cols: 4, items: [
    { id: 'ph:currency-dollar-duotone',   ic: '#006866', bg: '#E8FAF5', name: 'Efectivo' },
    { id: 'ph:credit-card-duotone',       ic: '#1E88E5', bg: '#E3F2FD', name: 'Débito' },
    { id: 'ph:credit-card-duotone',       ic: '#FB8C00', bg: '#FFF3E0', name: 'Crédito' },
    { id: 'ph:arrows-left-right-duotone', ic: '#006866', bg: '#E8FAF5', name: 'Transferencia' },
    { id: 'ph:receipt-duotone',           ic: '#5E35B1', bg: '#EDE7F6', name: 'Cheque' },
    { id: 'simple-icons:bitcoin',         ic: '#F57F17', bg: '#FFF8E0', name: 'Cripto' },
    { id: 'ph:qr-code-duotone',           ic: '#424242', bg: '#F5F5F5', name: 'QR / CVU' },
    { id: 'ph:gift-duotone',              ic: '#C2185B', bg: '#FCE4EC', name: 'Vale / Cupón' },
  ]},
  { s: 'Streaming & Video', cols: 4, items: [
    { id: 'simple-icons:netflix',         ic: '#E50914', bg: '#FFF0F0', name: 'Netflix' },
    { id: 'simple-icons:youtube',         ic: '#FF0000', bg: '#FFF0F0', name: 'YouTube' },
    { id: 'simple-icons:disneyplus',      ic: '#113CCF', bg: '#EEF2FF', name: 'Disney+' },
    { id: 'simple-icons:primevideo',      ic: '#00A8E0', bg: '#E8F6FF', name: 'Prime Video' },
    { id: 'simple-icons:hbo',             ic: '#6800D7', bg: '#EEE0FF', name: 'Max (HBO)' },
    { id: 'simple-icons:twitch',          ic: '#9146FF', bg: '#EEE0FF', name: 'Twitch' },
    { id: 'simple-icons:appletv',         ic: '#424242', bg: '#F5F5F5', name: 'Apple TV+' },
    { id: 'simple-icons:crunchyroll',     ic: '#F47521', bg: '#FFF3E0', name: 'Crunchyroll' },
    { id: 'simple-icons:paramount',       ic: '#0064FF', bg: '#EEF2FF', name: 'Paramount+' },
    { id: 'simple-icons:tiktok',          ic: '#1a1a1a', bg: '#F5F5F5', name: 'TikTok' },
    { id: 'simple-icons:vimeo',           ic: '#1AB7EA', bg: '#E8F7FF', name: 'Vimeo' },
  ]},
  { s: 'Música', cols: 4, items: [
    { id: 'simple-icons:spotify',         ic: '#1DB954', bg: '#EDFFF5', name: 'Spotify' },
    { id: 'simple-icons:youtubemusic',    ic: '#FF0000', bg: '#FFF0F0', name: 'YT Music' },
    { id: 'simple-icons:applemusic',      ic: '#FC3C44', bg: '#FFF0F4', name: 'Apple Music' },
    { id: 'simple-icons:tidal',           ic: '#007A7A', bg: '#F0FAFA', name: 'Tidal' },
    { id: 'simple-icons:deezer',          ic: '#FF5722', bg: '#FFF3E0', name: 'Deezer' },
    { id: 'simple-icons:soundcloud',      ic: '#FF5500', bg: '#FFF3E0', name: 'SoundCloud' },
    { id: 'simple-icons:bandcamp',        ic: '#1DA0C3', bg: '#E8F8EE', name: 'Bandcamp' },
  ]},
  { s: 'Gaming', cols: 4, items: [
    { id: 'simple-icons:steam',           ic: '#1B2838', bg: '#E8F0F8', name: 'Steam' },
    { id: 'simple-icons:playstation',     ic: '#003087', bg: '#E8EEFF', name: 'PlayStation' },
    { id: 'simple-icons:xbox',            ic: '#107C10', bg: '#E8FFE8', name: 'Xbox' },
    { id: 'simple-icons:nintendo',        ic: '#E60012', bg: '#FFF0F0', name: 'Nintendo' },
    { id: 'simple-icons:epicgames',       ic: '#1a1a1a', bg: '#F5F5F5', name: 'Epic Games' },
    { id: 'simple-icons:ea',              ic: '#FF4747', bg: '#E8F0FF', name: 'EA' },
    { id: 'simple-icons:riotgames',       ic: '#D0021B', bg: '#FFF0F0', name: 'Riot Games' },
  ]},
  { s: 'Apps y servicios', cols: 4, items: [
    { id: 'simple-icons:adobe',           ic: '#FF0000', bg: '#FFF0F0', name: 'Adobe' },
    { id: 'simple-icons:microsoft',       ic: '#0078D4', bg: '#E8F0FF', name: 'Microsoft' },
    { id: 'simple-icons:google',          ic: '#4285F4', bg: '#F5F5F5', name: 'Google' },
    { id: 'simple-icons:dropbox',         ic: '#0061FF', bg: '#E8F0FF', name: 'Dropbox' },
    { id: 'simple-icons:slack',           ic: '#4A154B', bg: '#F5E8FF', name: 'Slack' },
    { id: 'simple-icons:notion',          ic: '#1a1a1a', bg: '#F5F5F5', name: 'Notion' },
    { id: 'simple-icons:github',          ic: '#1a1a1a', bg: '#F5F5F5', name: 'GitHub' },
    { id: 'simple-icons:figma',           ic: '#F24E1E', bg: '#FFF0F4', name: 'Figma' },
    { id: 'simple-icons:zoom',            ic: '#2D8CFF', bg: '#E8F0FF', name: 'Zoom' },
    { id: 'simple-icons:canva',           ic: '#00C4CC', bg: '#E8F8FF', name: 'Canva' },
    { id: 'simple-icons:googledrive',     ic: '#4285F4', bg: '#F5F5F5', name: 'Google Drive' },
    { id: 'ph:cloud-duotone',             ic: '#3693F3', bg: '#E8F4FF', name: 'iCloud' },
  ]},
  { s: 'Delivery & movilidad', cols: 4, items: [
    { id: 'simple-icons:uber',            ic: '#1a1a1a', bg: '#F5F5F5', name: 'Uber' },
    { id: 'simple-icons:ubereats',        ic: '#06C167', bg: '#EDFFF5', name: 'Uber Eats' },
    { id: 'ph:shopping-bag-duotone',      ic: '#FF441A', bg: '#FFF0E8', name: 'Rappi' },
    { id: 'ph:hamburger-duotone',         ic: '#FF2A00', bg: '#FFF0F0', name: 'PedidosYa' },
    { id: 'ph:car-duotone',               ic: '#5D2D91', bg: '#EDE7F6', name: 'Cabify' },
    { id: 'simple-icons:airbnb',          ic: '#FF5A5F', bg: '#FFF0F4', name: 'Airbnb' },
    { id: 'simple-icons:bookingdotcom',   ic: '#003580', bg: '#E8F0FF', name: 'Booking' },
    { id: 'simple-icons:googlemaps',      ic: '#4285F4', bg: '#F5F5F5', name: 'Google Maps' },
  ]},
]

// Flat list of all brands for search
export const ALL_BRANDS = BRAND_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s.s })))
