import { useState, useMemo, useEffect } from 'react'
import { IconCalculator, IconInfoCircle, IconChevronDown, IconChevronUp, IconCreditCard, IconCash, IconAlertTriangle, IconCalendar } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoPaymentMethods, demoTransactions } from '../lib/demoData'
import { format, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Helpers ────────────────────────────────────────────────────────────────────

function NumInput({ value, onChange, placeholder, className }) {
  const display = value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
  return (
    <input type="text" inputMode="numeric" value={display} placeholder={placeholder} className={className}
      onChange={e => onChange(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''))} />
  )
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n) {
  return `${n.toFixed(2).replace('.', ',')}%`
}

function calcNPV(cuota, n, monthlyPct) {
  const r = monthlyPct / 100
  if (r === 0) return cuota * n
  let npv = 0
  for (let i = 1; i <= n; i++) npv += cuota / Math.pow(1 + r, i)
  return npv
}

function findBreakEven(cashPrice, cuota, n) {
  let lo = 0, hi = 200
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (calcNPV(cuota, n, mid) > cashPrice) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function getCycleRange(closingDay) {
  const today = new Date()
  const d = today.getDate()
  if (d > closingDay) {
    return {
      cycleStart:  new Date(today.getFullYear(), today.getMonth(), closingDay + 1),
      nextClosing: new Date(today.getFullYear(), today.getMonth() + 1, closingDay),
    }
  }
  return {
    cycleStart:  new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1),
    nextClosing: new Date(today.getFullYear(), today.getMonth(), closingDay),
  }
}

function getInstallmentSchedule(closingDay, dueDay, n) {
  const today = new Date()
  const offset = today.getDate() <= closingDay ? 0 : 1
  return Array.from({ length: n }, (_, i) => {
    const closing = new Date(today.getFullYear(), today.getMonth() + offset + i, closingDay)
    const dueCandidate = new Date(closing.getFullYear(), closing.getMonth(), dueDay)
    const due = dueCandidate > closing
      ? dueCandidate
      : new Date(closing.getFullYear(), closing.getMonth() + 1, dueDay)
    return { closing, due }
  })
}

const PRESET_INFLATIONS = [3, 5, 8, 10, 12, 15]
const CUOTAS_OPTIONS    = [2, 3, 6, 9, 12, 18, 24, 36]

// ── Main ───────────────────────────────────────────────────────────────────────

export function Calculadora() {
  const { user } = useAuth()
  const [cashPrice,       setCashPrice]       = useState('')
  const [installments,    setInstallments]    = useState(12)
  const [cuotaAmount,     setCuotaAmount]     = useState('')
  const [inflation,       setInflation]       = useState(8)
  const [customInflation, setCustomInflation] = useState('')
  const [showTable,       setShowTable]       = useState(false)
  const [cuotaMode,       setCuotaMode]       = useState('total') // 'total' | 'cuota'
  const [totalAmount,     setTotalAmount]     = useState('')
  const [cards,           setCards]           = useState([])
  const [transactions,    setTransactions]    = useState([])
  const [selectedCardId,  setSelectedCardId]  = useState('')

  useEffect(() => {
    if (!user) return
    if (isDemo(user)) {
      setCards(demoPaymentMethods.filter(p => p.account_type === 'credit_card'))
      setTransactions(demoTransactions)
      return
    }
    Promise.all([
      supabase.from('payment_methods').select('*').eq('user_id', user.id).eq('account_type', 'credit_card').order('name'),
      supabase.from('transactions').select('*').eq('user_id', user.id),
    ]).then(([{ data: pm }, { data: tx }]) => {
      setCards(pm ?? [])
      setTransactions(tx ?? [])
    })
  }, [user])

  const selectedCard = cards.find(c => c.id === selectedCardId) ?? null

  const cardContext = useMemo(() => {
    if (!selectedCard) return null
    const { closing_day, due_day, credit_limit } = selectedCard

    // Cycle spending
    let cycleSpent = 0
    if (closing_day) {
      const { cycleStart, nextClosing } = getCycleRange(closing_day)
      cycleSpent = transactions
        .filter(t => t.payment_method_id === selectedCard.id && t.type === 'expense' && !t.transfer_group_id)
        .filter(t => { const d = new Date(t.date + 'T12:00:00'); return d >= cycleStart && d <= nextClosing })
        .reduce((s, t) => s + t.amount, 0)
    }

    const available      = credit_limit ? credit_limit - cycleSpent : null
    const cashNum        = parseFloat(cashPrice) || 0
    const cuotaNum       = parseFloat(cuotaAmount) || 0
    const totalInstall   = cuotaNum * installments
    const purchaseAmount = cashNum // what we're evaluating
    const newCycleTotal  = cycleSpent + (cuotaNum || cashNum)
    const overLimit      = credit_limit && newCycleTotal > credit_limit

    const schedule = closing_day
      ? getInstallmentSchedule(closing_day, due_day, installments)
      : null

    return { cycleSpent, available, credit_limit, overLimit, newCycleTotal, schedule, closing_day, due_day }
  }, [selectedCard, transactions, cashPrice, cuotaAmount, installments])

  const effectiveInflation = customInflation !== '' ? parseFloat(customInflation) : inflation

  const result = useMemo(() => {
    const cash  = parseFloat(cashPrice)
    const cuota = parseFloat(cuotaAmount)
    const n     = installments
    const r     = effectiveInflation
    if (!cash || !cuota || !n || isNaN(r) || r < 0) return null

    const total       = cuota * n
    const interestPct = ((total - cash) / cash) * 100
    const npv         = calcNPV(cuota, n, r)
    const realSaving  = cash - npv
    const breakEven   = findBreakEven(cash, cuota, n)
    const cuotasConvienen = npv < cash

    const months = Array.from({ length: n }, (_, i) => ({
      month:     i + 1,
      nominal:   cuota,
      realValue: cuota / Math.pow(1 + r / 100, i + 1),
      closing:   cardContext?.schedule?.[i]?.closing ?? null,
      due:       cardContext?.schedule?.[i]?.due      ?? null,
    }))

    return { cash, cuota, n, total, interestPct, npv, realSaving, breakEven, cuotasConvienen, months }
  }, [cashPrice, cuotaAmount, installments, effectiveInflation, cardContext])

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora</h1>
        <p className="text-gray-500 text-sm">¿Conviene pagar al contado o en cuotas?</p>
      </div>

      {/* ── Form ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

        {/* Tarjeta (opcional) */}
        {cards.length > 0 && (
          <div className="flex items-center min-h-[56px] gap-4 px-5">
            <span className="text-sm text-gray-400 w-36 flex-shrink-0">Tarjeta</span>
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <button type="button" onClick={() => setSelectedCardId('')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${!selectedCardId ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                Sin tarjeta
              </button>
              {cards.map(c => (
                <button key={c.id} type="button" onClick={() => setSelectedCardId(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${selectedCardId === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Precio contado */}
        <div className="flex items-center min-h-[56px] gap-4 px-5">
          <span className="text-sm text-gray-400 w-36 flex-shrink-0">Precio contado</span>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-sm text-gray-400">$</span>
            <NumInput value={cashPrice} onChange={setCashPrice} placeholder="0"
              className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none" />
          </div>
        </div>

        {/* Cuotas */}
        <div className="flex items-center min-h-[56px] gap-4 px-5">
          <span className="text-sm text-gray-400 w-36 flex-shrink-0">Cant. de cuotas</span>
          <div className="flex-1 flex flex-wrap gap-1.5">
            {CUOTAS_OPTIONS.map(n => (
              <button key={n} type="button" onClick={() => {
                setInstallments(n)
                if (cuotaMode === 'total' && totalAmount) {
                  setCuotaAmount(String(Math.round(parseFloat(totalAmount) / n)))
                }
              }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${installments === n ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Valor cuota / total */}
        <div className="flex items-center min-h-[56px] gap-4 px-5">
          <div className="w-36 flex-shrink-0 flex flex-col gap-0.5">
            <span className="text-sm text-gray-400">{cuotaMode === 'cuota' ? 'Valor por cuota' : 'Total en cuotas'}</span>
            <button type="button" onClick={() => { setCuotaMode(m => m === 'cuota' ? 'total' : 'cuota'); setTotalAmount(''); setCuotaAmount('') }}
              className="text-xs text-primary-500 hover:underline text-left">
              Ingresar {cuotaMode === 'cuota' ? 'el total' : 'por cuota'}
            </button>
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-sm text-gray-400">$</span>
            {cuotaMode === 'cuota' ? (
              <>
                <NumInput value={cuotaAmount} onChange={setCuotaAmount} placeholder="0"
                  className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none" />
                {cuotaAmount && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    Total {fmt(parseFloat(cuotaAmount) * installments)}
                  </span>
                )}
              </>
            ) : (
              <>
                <NumInput value={totalAmount} onChange={v => {
                  setTotalAmount(v)
                  const perCuota = v ? Math.round(parseFloat(v) / installments) : ''
                  setCuotaAmount(perCuota ? String(perCuota) : '')
                }} placeholder="0"
                  className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none" />
                {totalAmount && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {fmt(parseFloat(cuotaAmount))}/mes
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Inflación */}
        <div className="flex items-start gap-4 px-5 py-3">
          <span className="text-sm text-gray-400 w-36 flex-shrink-0 mt-1">Inflación mensual</span>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_INFLATIONS.map(p => (
                <button key={p} type="button" onClick={() => { setInflation(p); setCustomInflation('') }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${effectiveInflation === p && customInflation === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {p}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="200" step="0.5" value={customInflation}
                onChange={e => setCustomInflation(e.target.value)} placeholder="Otro %"
                className="w-24 text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500" />
              <span className="text-xs text-gray-400">% mensual personalizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card context panel ── */}
      {selectedCard && cardContext && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <IconCreditCard size={16} className="text-primary-500" />
            <span className="font-semibold text-sm text-gray-800">{selectedCard.name}</span>
            {!cardContext.closing_day && (
              <span className="ml-auto text-xs text-orange-500 flex items-center gap-1">
                <IconAlertTriangle size={12} /> Sin cierre configurado
              </span>
            )}
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Límite y uso */}
            {cardContext.credit_limit ? (
              <>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Ciclo actual: <strong className="text-gray-700">{fmt(cardContext.cycleSpent)}</strong></span>
                  <span>Disponible: <strong className={cardContext.overLimit ? 'text-red-600' : 'text-gray-700'}>{fmt(cardContext.available)}</strong></span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  {(() => {
                    const base = (cardContext.cycleSpent / cardContext.credit_limit) * 100
                    const purchase = ((parseFloat(cuotaAmount) || 0) / cardContext.credit_limit) * 100
                    const total = Math.min(base + purchase, 100)
                    return (
                      <div className="h-full flex">
                        <div className="h-full bg-primary-400 rounded-l-full transition-all" style={{ width: `${Math.min(base, 100)}%` }} />
                        {purchase > 0 && (
                          <div className={`h-full transition-all ${cardContext.overLimit ? 'bg-red-400' : 'bg-primary-200'}`}
                            style={{ width: `${Math.min(purchase, 100 - base)}%` }} />
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{fmtPct((cardContext.cycleSpent / cardContext.credit_limit) * 100)} usado</span>
                  <span>Límite {fmt(cardContext.credit_limit)}</span>
                </div>
                {cardContext.overLimit && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs font-medium">
                    <IconAlertTriangle size={13} />
                    Esta compra supera el límite disponible de {fmt(cardContext.available)}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">
                Ciclo actual: <strong className="text-gray-700">{fmt(cardContext.cycleSpent)}</strong> · Configurá el límite en <a href="/tarjetas" className="text-primary-500 hover:underline">Tarjetas</a>
              </p>
            )}

            {/* Calendario de cuotas */}
            {cardContext.schedule && cuotaAmount && (
              <div className="mt-1">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <IconCalendar size={12} /> Calendario de vencimientos
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {cardContext.schedule.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-400 w-12 flex-shrink-0">Cuota {i + 1}</span>
                      <span className="text-gray-600 flex-1">
                        Cierra <strong>{format(s.closing, "d MMM", { locale: es })}</strong>
                        {cardContext.due_day && <> · Vence <strong>{format(s.due, "d MMM", { locale: es })}</strong></>}
                      </span>
                      <span className="text-gray-700 font-medium ml-2">{fmt(parseFloat(cuotaAmount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!cardContext.closing_day && (
              <p className="text-xs text-gray-400">
                Configurá el día de cierre en <a href="/tarjetas" className="text-primary-500 hover:underline">Tarjetas</a> para ver el calendario de vencimientos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Resultado ── */}
      {result && (
        <div className="space-y-4">
          {/* Veredicto */}
          <div className={`rounded-2xl overflow-hidden ${result.cuotasConvienen ? 'bg-emerald-500' : 'bg-primary-600'}`}>
            <div className="px-6 pt-6 pb-5 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${result.cuotasConvienen ? 'bg-emerald-400' : 'bg-primary-500'}`}>
                {result.cuotasConvienen ? <IconCreditCard size={30} className="text-white" /> : <IconCash size={30} className="text-white" />}
              </div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-widest mb-1">Mejor opción</p>
              <p className="text-white font-extrabold text-4xl mb-2">
                {result.cuotasConvienen ? 'EN CUOTAS' : 'AL CONTADO'}
              </p>
              <p className="text-white/90 text-base">
                {result.cuotasConvienen
                  ? <>Pagás <strong>{fmt(Math.abs(result.realSaving))} menos</strong> en términos reales</>
                  : <>Las cuotas te cuestan <strong>{fmt(Math.abs(result.realSaving))} más</strong> en términos reales</>
                }
              </p>
            </div>
            <div className={`grid grid-cols-3 divide-x ${result.cuotasConvienen ? 'divide-emerald-400 bg-emerald-600' : 'divide-primary-500 bg-primary-700'}`}>
              <div className="px-4 py-4 text-center">
                <p className="text-white/60 text-xs mb-1">Contado</p>
                <p className="text-white font-bold text-base">{fmt(result.cash)}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-white/60 text-xs mb-1">Total nominal</p>
                <p className="text-white font-bold text-base">{fmt(result.total)}</p>
                <p className="text-white/60 text-xs">+{fmtPct(result.interestPct)}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-white/60 text-xs mb-1">Costo real</p>
                <p className="text-white font-bold text-base">{fmt(result.npv)}</p>
                <p className="text-white/60 text-xs">
                  {result.cuotasConvienen ? `-${fmtPct((result.realSaving / result.cash) * 100)}` : `+${fmtPct(Math.abs(result.realSaving / result.cash) * 100)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Break-even */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <IconInfoCircle size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Inflación de break-even: <span className="text-gray-900">{fmtPct(result.breakEven)} mensual</span></p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {effectiveInflation > result.breakEven
                    ? `Con tu inflación esperada (${fmtPct(effectiveInflation)}), las cuotas licúan más rápido que el interés que cobran.`
                    : `Con tu inflación esperada (${fmtPct(effectiveInflation)}), el interés de las cuotas supera lo que se licúa.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Tabla mes a mes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowTable(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <span>Desglose cuota por cuota</span>
              {showTable ? <IconChevronUp size={16} className="text-gray-400" /> : <IconChevronDown size={16} className="text-gray-400" />}
            </button>
            {showTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-t border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">#</th>
                      {result.months[0]?.closing && <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Cierre · Vto</th>}
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Nominal</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Valor real hoy</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Licuación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.months.map(({ month, nominal, realValue, closing, due }) => (
                      <tr key={month} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{month}/{result.n}</td>
                        {closing && (
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            {format(closing, "d MMM", { locale: es })}
                            {due && <span className="text-gray-400"> · {format(due, "d MMM", { locale: es })}</span>}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{fmt(nominal)}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{fmt(realValue)}</td>
                        <td className="px-4 py-2.5 text-right text-red-400 text-xs">-{fmtPct(((nominal - realValue) / nominal) * 100)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                      <td className="px-4 py-2.5 text-gray-600" colSpan={result.months[0]?.closing ? 2 : 1}>Total</td>
                      <td className="px-4 py-2.5 text-right text-gray-900">{fmt(result.total)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-600">{fmt(result.npv)}</td>
                      <td className="px-4 py-2.5 text-right text-red-400 text-xs">-{fmtPct(((result.total - result.npv) / result.total) * 100)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && (
        <div className="text-center py-16 text-gray-300">
          <IconCalculator size={48} className="mx-auto mb-3" />
          <p className="text-sm">Completá los datos para ver el análisis</p>
        </div>
      )}
    </div>
  )
}
