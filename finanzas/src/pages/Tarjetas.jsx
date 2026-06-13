import { useEffect, useState, useRef } from 'react'
import {
  IconCreditCard, IconSettings, IconCurrencyDollar, IconX,
  IconUpload, IconCircleCheck, IconClock, IconAlertTriangle, IconPlus, IconFileText,
  IconCalendar, IconTrendingUp, IconStack2, IconRefresh, IconChevronDown, IconChevronUp
} from '@tabler/icons-react'
import { IconDisplay } from '../components/ui/EmojiPicker'
import { PaymentMethodSheet } from '../components/ui/PaymentMethodSheet'
import { format, differenceInDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoPaymentMethods, demoTransactions, demoStatements } from '../lib/demoData'
import {
  getCurrentCycle, getUpcomingPeriods, getCycleDateRange,
  projectInstallmentsByPeriod, CARD_NETWORKS, AR_BANKS, CARD_COLORS, CARD_COLOR_CLASSES,
} from '../lib/creditCard'
import { parseStatementPDF } from '../lib/pdfParser'
import { fmt } from '../lib/fmt'

const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0)

const fmtDate = (d) => d ? format(new Date(d), 'dd/MM/yyyy') : '-'
const fmtPeriod = (p) => {
  const [y, m] = p.split('-')
  return format(new Date(parseInt(y), parseInt(m) - 1, 1), 'MMMM yyyy', { locale: es })
}
const daysUntil = (d) => differenceInDays(startOfDay(new Date(d)), startOfDay(new Date()))
const networkLabel = (v) => CARD_NETWORKS.find(n => n.value === v)?.label ?? v ?? ''
const networkColor = (v) => CARD_NETWORKS.find(n => n.value === v)?.color ?? '#6B7280'

function fmtTx(t) {
  return t.currency === 'USD' ? fmtUSD(t.amount) : fmt(t.amount)
}

function CycleAmounts({ arsTotal, usdTotal }) {
  if (usdTotal > 0 && arsTotal > 0) {
    return (
      <span>
        {fmt(arsTotal)}
        <span className="text-sm font-medium opacity-80"> + {fmtUSD(usdTotal)}</span>
      </span>
    )
  }
  if (usdTotal > 0) return <span>{fmtUSD(usdTotal)}</span>
  return <span>{fmt(arsTotal)}</span>
}

// ─── NumInput ────────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, placeholder, required }) {
  const display = value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <input
        type="text" inputMode="numeric" value={display}
        onChange={e => onChange(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''))}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  )
}

// ─── Badge de estado ──────────────────────────────────────────────────────────
function StatusBadge({ estado, dueDate }) {
  const days = dueDate ? daysUntil(dueDate) : null
  if (estado === 'pagado') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <IconCircleCheck size={11} /> Pagado
    </span>
  )
  if (estado === 'parcial') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
      <IconRefresh size={11} /> Parcial
    </span>
  )
  if (days !== null && days <= 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <IconAlertTriangle size={11} /> Vencido
    </span>
  )
  if (days !== null && days <= 5) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
      <IconClock size={11} /> Vence en {days}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
      <IconClock size={11} /> Pendiente
    </span>
  )
}

// ─── Resumen de una tarjeta (fila en la tabla de resumen) ─────────────────────
function CardRow({ card, cycleTx, statements, onSelect, isSelected }) {
  const { cycleEnd, dueDate } = getCurrentCycle(card)
  const arsTotal = cycleTx.filter(t => !t.currency || t.currency === 'ARS').reduce((s, t) => s + t.amount, 0)
  const usdTotal = cycleTx.filter(t => t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
  const limitPct = card.credit_limit ? Math.min((arsTotal / card.credit_limit) * 100, 100) : null
  const daysClose = daysUntil(cycleEnd)
  const net = networkLabel(card.card_network)

  const pendingSt = statements
    .filter(s => s.payment_method_id === card.id && s.estado !== 'pagado')
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))[0]

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 transition-all ${
        isSelected
          ? 'ring-2 ring-primary-500 ring-offset-2 shadow-md'
          : 'hover:shadow-md hover:scale-[1.01]'
      }`}
      style={{ background: card.card_color ?? '#1e293b' /* GGA exception: user-picked arbitrary hex from DB */ }}
    >
      {/* Decoracion de fondo */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 pointer-events-none bg-white translate-x-[30%] -translate-y-[30%]" />

        <div className="relative z-10 text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-medium opacity-60">{card.bank_name ?? 'Tarjeta'}</p>
              <p className="font-bold text-base leading-tight">{card.name}</p>
              {card.last_four && <p className="text-xs font-mono opacity-50 mt-0.5">.... {card.last_four}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-extrabold opacity-80">{net}</span>
              {pendingSt && (
                <div className="mt-1">
                  <StatusBadge estado={pendingSt.estado} dueDate={pendingSt.due_date} />
                </div>
              )}
            </div>
          </div>

          {/* Cifras principales */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] opacity-50 uppercase tracking-wide">Ciclo actual</p>
              <p className="text-lg font-bold"><CycleAmounts arsTotal={arsTotal} usdTotal={usdTotal} /></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-50 uppercase tracking-wide">
                {daysClose < 0 ? 'Cerrado' : daysClose === 0 ? 'Cierra hoy' : `Cierra en ${daysClose}d`}
              </p>
              <p className="text-sm font-semibold opacity-80">{fmtDate(cycleEnd)}</p>
              {dueDate && (
                <p className="text-[10px] opacity-50">Vence {fmtDate(dueDate)}</p>
              )}
            </div>
          </div>

          {/* Barra de limite */}
          {limitPct !== null && (
            <div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                {/* GGA exception: dynamic percentage width requires inline style */}
                <div className={`h-full rounded-full ${limitPct > 80 ? 'bg-red-400' : limitPct > 50 ? 'bg-amber-400' : 'bg-white/70'}`}
                  style={{ width: `${limitPct}%` }} />
              </div>
              <p className="text-[10px] opacity-40 mt-1">{fmt(arsTotal)} de {fmt(card.credit_limit)} disponibles</p>
            </div>
          )}

          {/* Indicador de expandido */}
          <div className="flex justify-center mt-2 opacity-40">
            {isSelected ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Modal Configuracion ──────────────────────────────────────────────────────
function ConfigModal({ card, onSave, onClose }) {
  const [bankName, setBankName] = useState(card.bank_name ?? '')
  const [cardNetwork, setCardNetwork] = useState(card.card_network ?? 'visa')
  const [lastFour, setLastFour] = useState(card.last_four ?? '')
  const [closingDay, setClosingDay] = useState(card.closing_day ?? '')
  const [dueDay, setDueDay] = useState(card.due_day ?? '')
  const [creditLimit, setCreditLimit] = useState(card.credit_limit ? String(card.credit_limit) : '')
  const [weekendAdj, setWeekendAdj] = useState(card.weekend_adjustment ?? 'before')
  const [cardColor, setCardColor] = useState(card.card_color ?? CARD_COLORS[0])
  const [expiryDate, setExpiryDate] = useState(card.expiry_date ?? '')
  const [securityCode, setSecurityCode] = useState(card.security_code ?? '')
  const [saving, setSaving] = useState(false)

  // Auto-format expiry MM/YY
  const handleExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) setExpiryDate(digits.slice(0, 2) + '/' + digits.slice(2))
    else setExpiryDate(digits)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      bank_name: bankName || null,
      card_network: cardNetwork,
      last_four: lastFour || null,
      closing_day: parseInt(closingDay) || null,
      due_day: parseInt(dueDay) || null,
      credit_limit: parseFloat(String(creditLimit).replace(/\./g, '')) || null,
      weekend_adjustment: weekendAdj,
      card_color: cardColor,
      expiry_date: expiryDate || null,
      security_code: securityCode || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={save} className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">Configurar tarjeta</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><IconX size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
              <select value={bankName} onChange={e => setBankName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="">Seleccionar</option>
                {AR_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Red</label>
              <div className="flex gap-1 flex-wrap">
                {CARD_NETWORKS.map(n => (
                  <button key={n.value} type="button" onClick={() => setCardNetwork(n.value)}
                    className={`px-2 py-1 rounded-md text-xs font-bold border-2 transition ${cardNetwork === n.value ? n.activeClass : 'border-gray-200 text-gray-400'}`}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ultimos 4 digitos</label>
              <input type="text" inputMode="numeric" value={lastFour}
                onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
              <input type="text" inputMode="numeric" value={expiryDate}
                onChange={e => handleExpiry(e.target.value)}
                placeholder="MM/YY" maxLength={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
              <input type="text" inputMode="numeric" value={securityCode}
                onChange={e => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-700">
              El CVV se guarda sin cifrado. Recomendamos cargar solo el vencimiento y dejar el CVV vacio si preferis mas seguridad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de cierre</label>
              <input type="number" min="1" max="28" value={closingDay}
                onChange={e => setClosingDay(e.target.value)} placeholder="Ej: 15"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de vencimiento</label>
              <input type="number" min="1" max="28" value={dueDay}
                onChange={e => setDueDay(e.target.value)} placeholder="Ej: 22"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <NumInput label="Limite de credito" value={creditLimit} onChange={setCreditLimit} placeholder="Sin limite" />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Si el cierre cae en finde/feriado</label>
            <div className="flex gap-2">
              {[['before', 'Dia habil anterior'], ['after', 'Dia habil siguiente']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setWeekendAdj(v)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium border-2 transition ${weekendAdj === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color de la tarjeta</label>
            <div className="flex gap-2 flex-wrap items-center">
              {CARD_COLORS.map((c, i) => (
                <button key={c} type="button" onClick={() => setCardColor(c)}
                  className={`w-8 h-8 rounded-full border-4 transition ${CARD_COLOR_CLASSES[i]} ${cardColor === c ? 'border-white ring-2 ring-gray-400 scale-110' : 'border-transparent'}`} />
              ))}
              <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)}
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Modal Resumen ────────────────────────────────────────────────────────────
function StatementModal({ card, statement, cycleTx, onSave, onClose }) {
  const isEdit = !!statement
  const { cycleEnd, dueDate } = getCurrentCycle(card)
  const defClosing = isEdit ? new Date(statement.closing_date) : cycleEnd
  const defDue = isEdit ? (statement.due_date ? new Date(statement.due_date) : null) : dueDate

  const [period, setPeriod] = useState(isEdit ? statement.period : format(cycleEnd, 'yyyy-MM'))
  const [closingDateStr, setClosingDateStr] = useState(format(defClosing, 'yyyy-MM-dd'))
  const [dueDateStr, setDueDateStr] = useState(defDue ? format(defDue, 'yyyy-MM-dd') : '')
  const [saldoAnterior, setSaldoAnterior] = useState(String(statement?.saldo_anterior ?? '0'))
  const [pagos, setPagos] = useState(String(statement?.pagos_acreditados ?? '0'))
  const [compras, setCompras] = useState(String(statement?.compras_periodo ?? '0'))
  const [cuotas, setCuotas] = useState(String(statement?.cuotas_periodo ?? '0'))
  const [ajustes, setAjustes] = useState(String(statement?.ajustes ?? '0'))
  const [totalResumen, setTotalResumen] = useState(String(statement?.total_resumen ?? ''))
  const [pagoMinimo, setPagoMinimo] = useState(String(statement?.pago_minimo ?? ''))
  const [notas, setNotas] = useState(statement?.notas ?? '')
  const [saving, setSaving] = useState(false)
  const [pdfParsing, setPdfParsing] = useState(false)
  const [pdfFields, setPdfFields] = useState({})
  const [pdfError, setPdfError] = useState('')
  const fileRef = useRef()

  const cycleCalcTotal = cycleTx.filter(t => !t.currency || t.currency === 'ARS').reduce((s, t) => s + t.amount, 0)
  const calcTotal = (parseInt(saldoAnterior) || 0) - (parseInt(pagos) || 0)
    + (parseInt(compras) || 0) + (parseInt(cuotas) || 0) + (parseInt(ajustes) || 0)

  const handlePDF = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfParsing(true); setPdfError('')
    const result = await parseStatementPDF(file)
    setPdfParsing(false)
    if (!result.ok) { setPdfError(result.error); return }
    const found = {}
    if (result.total_resumen)     { setTotalResumen(String(Math.round(result.total_resumen)));      found.total_resumen = true }
    if (result.pago_minimo)       { setPagoMinimo(String(Math.round(result.pago_minimo)));          found.pago_minimo = true }
    if (result.saldo_anterior)    { setSaldoAnterior(String(Math.round(result.saldo_anterior)));    found.saldo_anterior = true }
    if (result.pagos_acreditados) { setPagos(String(Math.round(result.pagos_acreditados)));         found.pagos_acreditados = true }
    if (result.compras_periodo)   { setCompras(String(Math.round(result.compras_periodo)));         found.compras_periodo = true }
    if (result.cuotas_periodo)    { setCuotas(String(Math.round(result.cuotas_periodo)));           found.cuotas_periodo = true }
    if (result.ajustes)           { setAjustes(String(Math.round(result.ajustes)));                 found.ajustes = true }
    if (result.closing_date)      { setClosingDateStr(format(result.closing_date, 'yyyy-MM-dd'));    found.closing_date = true }
    if (result.due_date)          { setDueDateStr(format(result.due_date, 'yyyy-MM-dd'));            found.due_date = true }
    setPdfFields(found)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    const rawTotal = parseFloat(String(totalResumen).replace(/\./g, ''))
    await onSave({
      period, closing_date: closingDateStr, due_date: dueDateStr || null,
      saldo_anterior: parseFloat(saldoAnterior) || 0,
      pagos_acreditados: parseFloat(pagos) || 0,
      compras_periodo: parseFloat(compras) || 0,
      cuotas_periodo: parseFloat(cuotas) || 0,
      ajustes: parseFloat(ajustes) || 0,
      total_resumen: rawTotal || calcTotal,
      pago_minimo: parseFloat(String(pagoMinimo).replace(/\./g, '')) || null,
      notas: notas || null, estado: 'pendiente',
    })
    setSaving(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSave} className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold">{isEdit ? 'Editar resumen' : 'Cargar resumen'}</h2>
            <p className="text-xs text-gray-500">{card.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><IconX size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconUpload size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Subir PDF del banco</p>
                <p className="text-xs text-gray-400">Completa los campos automaticamente</p>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={pdfParsing}
                className="px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex-shrink-0">
                {pdfParsing ? 'Leyendo...' : 'Subir PDF'}
              </button>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handlePDF} className="hidden" />
            </div>
            {pdfError && <p className="text-xs text-red-500 mt-2">{pdfError}</p>}
            {Object.keys(pdfFields).length > 0 && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <IconCircleCheck size={12} /> {Object.keys(pdfFields).length} campos completados - revisa los datos
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Periodo</label>
              <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${pdfFields.closing_date ? 'text-emerald-600' : 'text-gray-600'}`}>Cierre {pdfFields.closing_date && 'ok'}</label>
              <input type="date" value={closingDateStr} onChange={e => setClosingDateStr(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 ${pdfFields.closing_date ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${pdfFields.due_date ? 'text-emerald-600' : 'text-gray-600'}`}>Vencimiento {pdfFields.due_date && 'ok'}</label>
              <input type="date" value={dueDateStr} onChange={e => setDueDateStr(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 ${pdfFields.due_date ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'}`} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desglose del resumen</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                [saldoAnterior, setSaldoAnterior, 'saldo_anterior', 'Saldo anterior'],
                [pagos, setPagos, 'pagos_acreditados', 'Pagos acreditados'],
                [compras, setCompras, 'compras_periodo', 'Compras del periodo'],
                [cuotas, setCuotas, 'cuotas_periodo', 'Cuotas del periodo'],
                [ajustes, setAjustes, 'ajustes', 'Intereses / ajustes'],
              ].map(([val, set, field, label]) => (
                <NumInput key={field} label={`${label}${pdfFields[field] ? ' ok' : ''}`} value={val} onChange={set} placeholder="0" />
              ))}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 text-xs">
              <span className="text-gray-400">Total calculado</span>
              <span className="font-semibold text-gray-700">{fmt(calcTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumInput label={`Total a pagar${pdfFields.total_resumen ? ' ok' : ''}`}
              value={totalResumen} onChange={setTotalResumen}
              placeholder={String(calcTotal > 0 ? calcTotal : '')} required />
            <NumInput label={`Pago minimo${pdfFields.pago_minimo ? ' ok' : ''}`}
              value={pagoMinimo} onChange={setPagoMinimo} placeholder="Opcional" />
          </div>

          {cycleCalcTotal > 0 && (
            <div className="bg-primary-50 rounded-xl p-3 flex items-start gap-2">
              <IconTrendingUp size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-primary-700">
                <p>Transacciones del ciclo (ARS): <strong>{fmt(cycleCalcTotal)}</strong></p>
                {totalResumen && Math.abs(parseFloat(String(totalResumen).replace(/\./g, '')) - cycleCalcTotal) > 500 && (
                  <p className="text-orange-600 mt-0.5">
                    Diferencia con el resumen: {fmt(Math.abs(parseFloat(String(totalResumen).replace(/\./g, '')) - cycleCalcTotal))}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Observaciones opcionales..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar resumen'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Modal Pagar resumen ──────────────────────────────────────────────────────
function PayModal({ card, statement, accounts, onPay, onClose }) {
  const pending = statement.total_resumen - (statement.monto_pagado ?? 0)
  const [amount, setAmount] = useState(String(pending))
  const [sourceId, setSourceId] = useState(accounts[0]?.id ?? '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const selectedSource = accounts.find(a => a.id === sourceId)

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    await onPay({ amount: parseFloat(String(amount).replace(/\./g, '')), source_id: sourceId, date })
    setSaving(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={save} className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <div>
            <h2 className="text-lg font-semibold">Pagar resumen</h2>
            <p className="text-xs text-gray-500">{card.name} - {fmtPeriod(statement.period)}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><IconX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Pendiente</span>
            <span className="font-bold text-orange-600">{fmt(pending)}</span>
          </div>
          <NumInput label="Monto a pagar" value={amount} onChange={setAmount} required />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde cuenta</label>
            <button type="button" onClick={() => setAccountOpen(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:border-gray-300 transition text-left">
              {selectedSource ? (
                <>
                  {selectedSource.icon && <IconDisplay icon={selectedSource.icon} size={16} className="flex-shrink-0" />}
                  <span className="flex-1 text-gray-900">{selectedSource.name}</span>
                </>
              ) : <span className="text-gray-400">Seleccionar cuenta...</span>}
            </button>
            {accountOpen && <PaymentMethodSheet title="Desde cuenta" value={sourceId} paymentMethods={accounts} onChange={setSourceId} onClose={() => setAccountOpen(false)} allowEmpty={false} />}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de pago</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancelar</button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Registrando...' : 'Registrar pago'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Panel de detalle ─────────────────────────────────────────────────────────
function CardDetail({ card, transactions, statements, accounts, onNewStatement, onEditStatement, onPayStatement, onConfig }) {
  const [tab, setTab] = useState('ciclo')
  const { cycleStart, cycleEnd, dueDate } = getCurrentCycle(card)
  const today = format(new Date(), 'yyyy-MM-dd')

  const cycleTx = transactions.filter(t =>
    t.payment_method_id === card.id && t.type === 'expense' &&
    t.date >= format(cycleStart, 'yyyy-MM-dd') && t.date <= format(cycleEnd, 'yyyy-MM-dd')
  )

  const cycleARS = cycleTx.filter(t => !t.currency || t.currency === 'ARS').reduce((s, t) => s + t.amount, 0)
  const cycleUSD = cycleTx.filter(t => t.currency === 'USD').reduce((s, t) => s + t.amount, 0)

  const cardStatements = statements
    .filter(s => s.payment_method_id === card.id)
    .sort((a, b) => b.period.localeCompare(a.period))

  const installmentGroups = {}
  transactions.filter(t => t.payment_method_id === card.id && t.installment_group_id).forEach(t => {
    if (!installmentGroups[t.installment_group_id]) installmentGroups[t.installment_group_id] = []
    installmentGroups[t.installment_group_id].push(t)
  })
  const activeInstallments = Object.entries(installmentGroups).map(([gid, txs]) => {
    txs.sort((a, b) => a.date.localeCompare(b.date))
    const pending = txs.filter(t => t.date >= today)
    const done = txs.length - pending.length
    const label = txs[0]?.notes?.replace(/\s*\(\d+\/\d+\)/, '') ?? 'Cuota'
    return { gid, label, total: txs.length, done, pending, monthly: txs[0]?.amount ?? 0, currency: txs[0]?.currency ?? null }
  }).filter(g => g.pending.length > 0)

  const futureTx = transactions.filter(t => t.payment_method_id === card.id && t.installment_group_id && t.date > today)
  const projection = projectInstallmentsByPeriod(card, futureTx)
  const upcomingPeriods = getUpcomingPeriods(card, 6)

  const TABS = [
    { key: 'ciclo', label: 'Ciclo', icon: IconCalendar },
    { key: 'resumenes', label: 'Resumenes', icon: IconFileText },
    { key: 'cuotas', label: 'Cuotas', icon: IconStack2 },
    { key: 'proyeccion', label: 'Proyeccion', icon: IconTrendingUp },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition -mb-px ${
              tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
        {/* Boton configurar al final */}
        <button onClick={onConfig}
          className="ml-auto px-4 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition flex-shrink-0">
          <IconSettings size={16} />
        </button>
      </div>

      <div className="p-5">
        {/* Ciclo actual */}
        {tab === 'ciclo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Inicio del ciclo', value: fmtDate(cycleStart) },
                { label: 'Cierre real', value: fmtDate(cycleEnd) },
                { label: 'Vencimiento', value: dueDate ? fmtDate(dueDate) : '-' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
            {cycleTx.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin gastos en el ciclo actual</p>
            ) : (
              <div className="space-y-0.5">
                {cycleTx.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      <IconDisplay icon={t.categories?.icon || 'IconShoppingCart:#EF4444'} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t.notes ?? t.categories?.name ?? '-'}
                        {t.installments > 1 && (
                          <span className="ml-1.5 text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-semibold">
                            {t.installment_number}/{t.installments}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{fmtDate(t.date)}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-semibold text-red-500">{fmtTx(t)}</span>
                      {t.currency === 'USD' && (
                        <span className="block text-[10px] text-green-600 font-medium">USD</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-sm font-semibold text-gray-700">Total ciclo</span>
                  <div className="text-right">
                    {cycleARS > 0 && <p className="font-bold text-gray-900">{fmt(cycleARS)}</p>}
                    {cycleUSD > 0 && <p className="font-bold text-green-700">{fmtUSD(cycleUSD)}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumenes */}
        {tab === 'resumenes' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={onNewStatement}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700">
                <IconPlus size={14} /> Cargar resumen
              </button>
            </div>
            {cardStatements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin resumenes cargados</p>
            ) : (
              <div className="space-y-2">
                {cardStatements.map(st => {
                  const paid = st.monto_pagado ?? 0
                  const pending = st.total_resumen - paid
                  const pct = st.total_resumen > 0 ? Math.min((paid / st.total_resumen) * 100, 100) : 0
                  return (
                    <div key={st.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{fmtPeriod(st.period)}</p>
                          <p className="text-xs text-gray-400">Cierre {fmtDate(st.closing_date)} - Vence {fmtDate(st.due_date)}</p>
                        </div>
                        <StatusBadge estado={st.estado} dueDate={st.due_date} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                        {st.compras_periodo > 0 && <div><p className="text-gray-400">Compras</p><p className="font-medium">{fmt(st.compras_periodo)}</p></div>}
                        {st.cuotas_periodo > 0 && <div><p className="text-gray-400">Cuotas</p><p className="font-medium">{fmt(st.cuotas_periodo)}</p></div>}
                        {st.ajustes > 0 && <div><p className="text-gray-400">Intereses</p><p className="font-medium text-orange-600">{fmt(st.ajustes)}</p></div>}
                        <div><p className="text-gray-400">Total</p><p className="font-bold text-gray-900 text-sm">{fmt(st.total_resumen)}</p></div>
                        {st.pago_minimo > 0 && <div><p className="text-gray-400">Pago min.</p><p className="font-medium">{fmt(st.pago_minimo)}</p></div>}
                        {paid > 0 && <div><p className="text-gray-400">Pagado</p><p className="font-medium text-emerald-600">{fmt(paid)}</p></div>}
                      </div>
                      {st.total_resumen > 0 && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                          {/* GGA exception: dynamic percentage width requires inline style */}
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEditStatement(st)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Editar</button>
                        {st.estado !== 'pagado' && pending > 0 && (
                          <button onClick={() => onPayStatement(st)}
                            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg">
                            <IconCurrencyDollar size={12} /> Pagar {fmt(pending)}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Cuotas */}
        {tab === 'cuotas' && (
          <div className="space-y-3">
            {activeInstallments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin cuotas en curso</p>
            ) : activeInstallments.map(g => (
              <div key={g.gid} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{g.label}</p>
                    <p className="text-xs text-gray-400">
                      {g.done}/{g.total} cuotas - {g.currency === 'USD' ? fmtUSD(g.monthly) : fmt(g.monthly)}/mes
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                    {g.pending.length} restante{g.pending.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  {/* GGA exception: dynamic percentage width requires inline style */}
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(g.done / g.total) * 100}%` }} />
                </div>
                <div className="space-y-1">
                  {g.pending.slice(0, 4).map(t => (
                    <div key={t.id} className="flex justify-between text-xs">
                      <span className="text-gray-500">Cuota {t.installment_number}/{g.total} - {fmtDate(t.date)}</span>
                      <span className="font-medium">{fmtTx(t)}</span>
                    </div>
                  ))}
                  {g.pending.length > 4 && <p className="text-xs text-gray-400 text-center">+{g.pending.length - 4} mas</p>}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 text-xs">
                  <span className="text-gray-400">Saldo restante</span>
                  <span className="font-bold text-gray-900">
                    {g.currency === 'USD' ? fmtUSD(g.pending.length * g.monthly) : fmt(g.pending.length * g.monthly)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Proyeccion */}
        {tab === 'proyeccion' && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 mb-3">Cuotas proyectadas en los proximos resumenes</p>
            {upcomingPeriods.map(({ period: p, closingDate, dueDate: dd }) => {
              const installmentAmt = projection[p] ?? 0
              const stExisting = statements.find(s => s.payment_method_id === card.id && s.period === p)
              return (
                <div key={p} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconCalendar size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{fmtPeriod(p)}</p>
                    <p className="text-xs text-gray-400">Cierre {fmtDate(closingDate)} - Vence {dd ? fmtDate(dd) : '-'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {installmentAmt > 0 ? (
                      <><p className="text-sm font-bold text-gray-900">{fmt(installmentAmt)}</p><p className="text-[10px] text-gray-400">en cuotas</p></>
                    ) : stExisting ? (
                      <StatusBadge estado={stExisting.estado} dueDate={stExisting.due_date} />
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────
export function Tarjetas() {
  const { user } = useAuth()
  const [cards, setCards] = useState([])
  const [transactions, setTransactions] = useState([])
  const [statements, setStatements] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)
  const [modal, setModal] = useState(null)

  const load = async () => {
    if (isDemo(user)) {
      const cc = demoPaymentMethods.filter(p => p.account_type === 'credit_card')
      const nonCC = demoPaymentMethods.filter(p => p.account_type !== 'credit_card' && p.type === 'immediate')
      setCards(cc)
      setAccounts(nonCC)
      setTransactions(demoTransactions)
      setStatements(demoStatements)
      setLoading(false)
      setSelectedCard(prev => prev ?? cc[0] ?? null)
      return
    }
    const [pmRes, txRes, stRes] = await Promise.all([
      supabase.from('payment_methods').select('id, name, account_type, type, icon, bank_name, card_network, card_color, last_four, closing_day, due_day, credit_limit, weekend_adjustment, expiry_date, security_code').eq('user_id', user.id).order('name'),
      supabase.from('transactions').select('id, type, amount, date, notes, currency, payment_method_id, transfer_group_id, installment_group_id, categories(name, type, icon)').eq('user_id', user.id).order('date'),
      supabase.from('credit_card_statements').select('id, payment_method_id, period, closing_date, due_date, saldo_anterior, pagos_acreditados, compras_periodo, cuotas_periodo, ajustes, total_resumen, pago_minimo, notas, estado, monto_pagado').eq('user_id', user.id).order('period', { ascending: false }),
    ])
    const all = pmRes.data ?? []
    const cc = all.filter(p => p.account_type === 'credit_card')
    const nonCC = all.filter(p => p.account_type !== 'credit_card' && p.type === 'immediate')
    setCards(cc)
    setAccounts(nonCC)
    setTransactions(txRes.data ?? [])
    setStatements(stRes.data ?? [])
    setLoading(false)
    setSelectedCard(prev => prev ? (cc.find(c => c.id === prev.id) ?? cc[0] ?? null) : (cc[0] ?? null))
  }

  useEffect(() => { if (user) load() }, [user])

  const saveConfig = async (values) => {
    if (!isDemo(user)) await supabase.from('payment_methods').update(values).eq('id', selectedCard.id).eq('user_id', user.id)
    setModal(null)
    load()
  }

  const saveStatement = async (values) => {
    if (isDemo(user)) {
      const id = modal?.data?.id ?? `st_${Date.now()}`
      setStatements(prev => [...prev.filter(s => s.id !== id),
        { ...values, id, user_id: 'demo', payment_method_id: selectedCard.id }])
      return
    }
    if (modal?.data?.id) {
      await supabase.from('credit_card_statements').update(values).eq('id', modal.data.id).eq('user_id', user.id)
    } else {
      await supabase.from('credit_card_statements').insert({ ...values, user_id: user.id, payment_method_id: selectedCard.id })
    }
    load()
  }

  const payStatement = async ({ amount, source_id, date }) => {
    const st = modal?.data
    if (!st) return
    const newPaid = (st.monto_pagado ?? 0) + amount
    const newEstado = newPaid >= st.total_resumen ? 'pagado' : 'parcial'
    if (isDemo(user)) {
      setStatements(prev => prev.map(s => s.id === st.id
        ? { ...s, monto_pagado: newPaid, fecha_pago: date, estado: newEstado } : s))
      return
    }
    const tgid = crypto.randomUUID()
    await Promise.all([
      supabase.from('credit_card_statements').update({ monto_pagado: newPaid, fecha_pago: date, estado: newEstado }).eq('id', st.id).eq('user_id', user.id),
      supabase.from('transactions').insert([
        { user_id: user.id, type: 'expense', amount, date, payment_method_id: source_id,
          notes: `Pago resumen ${fmtPeriod(st.period)} - ${selectedCard.name}`, transfer_group_id: tgid },
        { user_id: user.id, type: 'income', amount, date, payment_method_id: selectedCard.id,
          notes: `Pago resumen ${fmtPeriod(st.period)}`, transfer_group_id: tgid },
      ])
    ])
    load()
  }

  const cycleTxForCard = (card) => {
    if (!card.closing_day) return []
    const { cycleStart, cycleEnd } = getCurrentCycle(card)
    return transactions.filter(t =>
      t.payment_method_id === card.id && t.type === 'expense' && !t.transfer_group_id &&
      t.date >= format(cycleStart, 'yyyy-MM-dd') && t.date <= format(cycleEnd, 'yyyy-MM-dd')
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )

  if (cards.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
        <IconCreditCard size={28} className="text-orange-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sin tarjetas de credito</h2>
        <p className="text-sm text-gray-400 mt-1">Agrega una tarjeta desde Cuentas para empezar</p>
      </div>
      <a href="/cuentas" className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">
        <IconPlus size={16} /> Ir a Cuentas
      </a>
    </div>
  )

  // ── Resumen global ──────────────────────────────────────────────────────────
  const totalCycleDebtARS = cards.reduce((sum, card) => {
    return sum + cycleTxForCard(card).filter(t => !t.currency || t.currency === 'ARS').reduce((s, t) => s + t.amount, 0)
  }, 0)

  const totalCycleDebtUSD = cards.reduce((sum, card) => {
    return sum + cycleTxForCard(card).filter(t => t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
  }, 0)

  const pendingStatements = statements.filter(s => s.estado !== 'pagado')
  const totalPending = pendingStatements.reduce((s, st) => s + (st.total_resumen - (st.monto_pagado ?? 0)), 0)

  const nextDueSt = pendingStatements
    .filter(s => s.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

  const totalInstallmentsRemaining = (() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    return transactions
      .filter(t => t.installment_group_id && t.date > todayStr &&
        cards.some(c => c.id === t.payment_method_id))
      .reduce((s, t) => s + t.amount, 0)
  })()

  const cycleLabel = totalCycleDebtUSD > 0
    ? `${fmt(totalCycleDebtARS)} + ${fmtUSD(totalCycleDebtUSD)}`
    : fmt(totalCycleDebtARS)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tarjetas</h1>
        <p className="text-gray-500 text-sm">Gestion de tarjetas de credito</p>
      </div>

      {/* ── Resumen global ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ciclos actuales', value: cycleLabel, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Resumenes pendientes', value: fmt(totalPending), color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Proximo vencimiento', value: nextDueSt ? fmtDate(nextDueSt.due_date) : '-', color: nextDueSt && daysUntil(nextDueSt.due_date) <= 5 ? 'text-red-600' : 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Cuotas restantes', value: fmt(totalInstallmentsRemaining), color: 'text-primary-600', bg: 'bg-primary-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`font-bold text-base ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Grid de tarjetas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <CardRow
            key={card.id}
            card={card}
            cycleTx={cycleTxForCard(card)}
            statements={statements}
            isSelected={selectedCard?.id === card.id}
            onSelect={() => setSelectedCard(prev => prev?.id === card.id ? null : card)}
          />
        ))}
      </div>

      {/* ── Panel de detalle (debajo del grid) ── */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          transactions={transactions}
          statements={statements}
          accounts={accounts}
          onNewStatement={() => setModal({ type: 'statement' })}
          onEditStatement={(st) => setModal({ type: 'statement', data: st })}
          onPayStatement={(st) => setModal({ type: 'pay', data: st })}
          onConfig={() => setModal({ type: 'config' })}
        />
      )}

      {/* ── Modals ── */}
      {modal?.type === 'config' && selectedCard && (
        <ConfigModal card={selectedCard} onSave={saveConfig} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'statement' && selectedCard && (
        <StatementModal
          card={selectedCard}
          statement={modal.data ?? null}
          cycleTx={cycleTxForCard(selectedCard)}
          onSave={saveStatement}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'pay' && selectedCard && modal.data && (
        <PayModal
          card={selectedCard}
          statement={modal.data}
          accounts={accounts}
          onPay={payStatement}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
