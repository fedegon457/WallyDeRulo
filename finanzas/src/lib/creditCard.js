import { format, addDays, subDays, startOfDay } from 'date-fns'

// ─── Feriados nacionales argentinos ───────────────────────────────────────────
// Feriados fijos (MM-DD)
const FIXED_HOLIDAYS = new Set([
  '01-01', // Año Nuevo
  '03-24', // Día de la Memoria
  '04-02', // Día del Veterano de Malvinas
  '05-01', // Día del Trabajador
  '05-25', // Revolución de Mayo
  '06-17', // Paso a la Inmortalidad del Gral. Güemes
  '06-20', // Día de la Bandera
  '07-09', // Día de la Independencia
  '12-08', // Inmaculada Concepción
  '12-25', // Navidad
])

// Feriados móviles por año (Carnaval, Semana Santa, Diversidad Cultural, Soberanía, San Martín)
const MOVEABLE_HOLIDAYS = {
  '2024': ['02-12', '02-13', '03-28', '03-29', '08-19', '10-14', '11-18'],
  '2025': ['03-03', '03-04', '04-17', '04-18', '08-18', '10-13', '11-17'],
  '2026': ['02-16', '02-17', '04-02', '04-03', '08-17', '10-12', '11-23'],
  '2027': ['02-08', '02-09', '03-25', '03-26', '08-16', '10-11', '11-22'],
}

export function isArgentineHoliday(date) {
  const d = new Date(date)
  const mmdd = format(d, 'MM-dd')
  const year = format(d, 'yyyy')
  return FIXED_HOLIDAYS.has(mmdd) || (MOVEABLE_HOLIDAYS[year] ?? []).includes(mmdd)
}

export function isBusinessDay(date) {
  const d = new Date(date)
  const dow = d.getDay()
  return dow !== 0 && dow !== 6 && !isArgentineHoliday(d)
}

function prevBizDay(date) {
  let d = subDays(new Date(date), 1)
  while (!isBusinessDay(d)) d = subDays(d, 1)
  return d
}

function nextBizDay(date) {
  let d = addDays(new Date(date), 1)
  while (!isBusinessDay(d)) d = addDays(d, 1)
  return d
}

// ─── Fecha real de cierre ─────────────────────────────────────────────────────
// nominalDay: día de cierre configurado (1-28)
// month: 0-indexed
// weekendAdjustment: 'before' (día hábil anterior) | 'after' (día hábil siguiente)
export function getActualClosingDate(nominalDay, month, year, weekendAdjustment = 'before') {
  const nominal = new Date(year, month, nominalDay)
  if (isBusinessDay(nominal)) return nominal
  return weekendAdjustment === 'before' ? prevBizDay(nominal) : nextBizDay(nominal)
}

// ─── Ciclo actual ─────────────────────────────────────────────────────────────
// Retorna { cycleStart, cycleEnd (= closingDate), dueDate }
export function getCurrentCycle(card) {
  const today = new Date()
  const cy = today.getFullYear()
  const cm = today.getMonth()
  const adj = card.weekend_adjustment ?? 'before'

  const thisClosing = getActualClosingDate(card.closing_day, cm, cy, adj)

  let cycleEnd, prevClosing
  if (startOfDay(today) <= startOfDay(thisClosing)) {
    cycleEnd = thisClosing
    prevClosing = getActualClosingDate(card.closing_day, cm - 1, cy, adj)
  } else {
    cycleEnd = getActualClosingDate(card.closing_day, cm + 1, cy, adj)
    prevClosing = thisClosing
  }

  const cycleStart = addDays(prevClosing, 1)
  const dueDate = getDueDate(card, cycleEnd)
  return { cycleStart, cycleEnd, dueDate }
}

// ─── Fecha de vencimiento ─────────────────────────────────────────────────────
export function getDueDate(card, closingDate) {
  const closing = new Date(closingDate)
  const dueDay = card.due_day
  if (!dueDay) return addDays(closing, 21)

  let due = new Date(closing.getFullYear(), closing.getMonth(), dueDay)
  if (due <= closing) {
    due = new Date(closing.getFullYear(), closing.getMonth() + 1, dueDay)
  }
  if (!isBusinessDay(due)) {
    due = (card.weekend_adjustment ?? 'before') === 'before' ? prevBizDay(due) : nextBizDay(due)
  }
  return due
}

// ─── Cierre/vencimiento para un período específico (yyyy-MM) ─────────────────
export function getClosingDateForPeriod(card, period) {
  const [year, month] = period.split('-').map(Number)
  return getActualClosingDate(card.closing_day, month - 1, year, card.weekend_adjustment ?? 'before')
}

export function getCycleDateRange(card, period) {
  const closingDate = getClosingDateForPeriod(card, period)
  const [year, month] = period.split('-').map(Number)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  const prevClosing = getClosingDateForPeriod(card, prevPeriod)
  const cycleStart = addDays(prevClosing, 1)
  const dueDate = getDueDate(card, closingDate)
  return { cycleStart, closingDate, dueDate }
}

// ─── Próximos períodos proyectados ───────────────────────────────────────────
export function getUpcomingPeriods(card, count = 6) {
  const today = new Date()
  const adj = card.weekend_adjustment ?? 'before'
  let y = today.getFullYear()
  let m = today.getMonth()

  const thisClosing = getActualClosingDate(card.closing_day, m, y, adj)
  if (startOfDay(today) > startOfDay(thisClosing)) m++

  const result = []
  for (let i = 0; i < count; i++) {
    const totalMonths = m + i
    const month = totalMonths % 12
    const year = y + Math.floor(totalMonths / 12)
    const closing = getActualClosingDate(card.closing_day, month, year, adj)
    const period = format(closing, 'yyyy-MM')
    result.push({ period, closingDate: closing, dueDate: getDueDate(card, closing) })
  }
  return result
}

// ─── Proyección de cuotas en próximos resúmenes ───────────────────────────────
// installmentTxs: transacciones con installment_group_id y fecha futura
// card: tarjeta con closing_day, due_day, weekend_adjustment
// Retorna: { [period]: total } de cuotas que caen en cada período
export function projectInstallmentsByPeriod(card, installmentTxs) {
  const map = {}
  for (const tx of installmentTxs) {
    const txDate = new Date(tx.date)
    // Find which period this installment falls in
    // A transaction dated X falls in the period whose cycle contains date X
    const y = txDate.getFullYear()
    const m = txDate.getMonth()
    const adj = card.weekend_adjustment ?? 'before'
    const closing = getActualClosingDate(card.closing_day, m, y, adj)

    let period
    if (startOfDay(txDate) <= startOfDay(closing)) {
      period = format(closing, 'yyyy-MM')
    } else {
      const nextClosing = getActualClosingDate(card.closing_day, m + 1, y, adj)
      period = format(nextClosing, 'yyyy-MM')
    }
    map[period] = (map[period] ?? 0) + tx.amount
  }
  return map
}

// ─── Helpers de formato ───────────────────────────────────────────────────────
export const AR_BANKS = [
  'Galicia', 'Santander', 'BBVA', 'Macro', 'HSBC', 'Naranja X',
  'ICBC', 'Ciudad', 'Nación', 'Provincia', 'Supervielle', 'Patagonia',
  'Brubank', 'Ualá', 'Mercado Pago', 'Personal Pay', 'Otro',
]

export const CARD_NETWORKS = [
  { value: 'visa',       label: 'Visa',        color: '#1A1F71' },
  { value: 'mastercard', label: 'Mastercard',  color: '#EB001B' },
  { value: 'amex',       label: 'Amex',        color: '#006FCF' },
  { value: 'naranja',    label: 'Naranja',      color: '#FF6600' },
  { value: 'cabal',      label: 'Cabal',        color: '#005DAA' },
  { value: 'other',      label: 'Otra',         color: '#6B7280' },
]

export const CARD_COLORS = [
  '#1e293b', '#1d4ed8', '#0f766e', '#7c3aed',
  '#b91c1c', '#c2410c', '#0369a1', '#166534',
]
