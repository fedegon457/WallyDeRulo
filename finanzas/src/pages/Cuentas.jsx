import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2,
  Banknote, Building2, CreditCard, PiggyBank,
  Smartphone, TrendingUp, AlertCircle, FileText,
  Shield, MoreHorizontal, Wallet, Eye, EyeOff
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoPaymentMethods, demoTransactions, demoPMAdd, demoPMUpdate, demoPMRemove } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { AR_BANKS, CARD_NETWORKS, CARD_COLORS } from '../lib/creditCard'
import { EmojiPicker, IconDisplay } from '../components/ui/EmojiPicker'

// ─── Configuración de tipos ───────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { value: 'cash',        label: 'Efectivo',          icon: Banknote,      color: 'bg-emerald-100 text-emerald-700', isDebt: false },
  { value: 'bank',        label: 'Banco',              icon: Building2,     color: 'bg-blue-100 text-blue-700',     isDebt: false },
  { value: 'debit_card',  label: 'Tarjeta de débito',  icon: CreditCard,    color: 'bg-cyan-100 text-cyan-700',     isDebt: false },
  { value: 'savings',     label: 'Ahorro',             icon: PiggyBank,     color: 'bg-violet-100 text-violet-700', isDebt: false },
  { value: 'e_payment',   label: 'Pago electrónico',   icon: Smartphone,    color: 'bg-indigo-100 text-indigo-700', isDebt: false },
  { value: 'investment',  label: 'Inversión',          icon: TrendingUp,    color: 'bg-yellow-100 text-yellow-700', isDebt: false },
  { value: 'credit_card', label: 'Tarjeta de crédito', icon: CreditCard,    color: 'bg-orange-100 text-orange-700', isDebt: true  },
  { value: 'credit_line', label: 'Línea de crédito',   icon: AlertCircle,   color: 'bg-red-100 text-red-700',       isDebt: true  },
  { value: 'loan',        label: 'Préstamo',           icon: FileText,      color: 'bg-rose-100 text-rose-700',     isDebt: true  },
  { value: 'insurance',   label: 'Seguro',             icon: Shield,        color: 'bg-gray-100 text-gray-600',     isDebt: false },
  { value: 'other',       label: 'Otros',              icon: MoreHorizontal,color: 'bg-gray-100 text-gray-600',     isDebt: false },
]

const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL', 'UYU']

const typeInfo = (value) => ACCOUNT_TYPES.find(t => t.value === value) ?? ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]

function fmtCurrency(n, currency = 'ARS') {
  if (currency === 'ARS') {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

function fmtARS(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

// ─── Formulario de cuenta ─────────────────────────────────────────────────────

function AccountForm({ initial, onSave, onCancel }) {
  const [accountType, setAccountType] = useState(initial?.account_type ?? 'bank')
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'ARS')
  const [initialBalance, setInitialBalance] = useState(initial?.initial_balance ?? '')
  // Campos de tarjeta de crédito
  const [bankName, setBankName] = useState(initial?.bank_name ?? '')
  const [cardNetwork, setCardNetwork] = useState(initial?.card_network ?? 'visa')
  const [lastFour, setLastFour] = useState(initial?.last_four ?? '')
  const [closingDay, setClosingDay] = useState(initial?.closing_day ?? '')
  const [dueDay, setDueDay] = useState(initial?.due_day ?? '')
  const [creditLimit, setCreditLimit] = useState(initial?.credit_limit ?? '')
  const [weekendAdj, setWeekendAdj] = useState(initial?.weekend_adjustment ?? 'before')
  const [cardColor, setCardColor] = useState(initial?.card_color ?? CARD_COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiry_date ?? '')
  const [securityCode, setSecurityCode] = useState(initial?.security_code ?? '')
  const [showCvv, setShowCvv] = useState(false)
  const [saving, setSaving] = useState(false)

  const info = typeInfo(accountType)
  const isCC = accountType === 'credit_card'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isDebt = typeInfo(accountType).isDebt
      const base = {
        name,
        account_type: accountType,
        currency,
        initial_balance: parseFloat(initialBalance) || 0,
        type: isDebt ? 'credit' : 'immediate',
        icon: icon || null,
      }
      const ccFields = isCC ? {
        bank_name: bankName || null,
        card_network: cardNetwork || null,
        last_four: lastFour || null,
        closing_day: parseInt(closingDay) || null,
        due_day: parseInt(dueDay) || null,
        credit_limit: parseFloat(String(creditLimit).replace(/\./g, '')) || null,
        weekend_adjustment: weekendAdj,
        card_color: cardColor,
        expiry_date: expiryDate || null,
        security_code: securityCode || null,
      } : {}
      await onSave({ ...base, ...ccFields })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de cuenta</label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map(t => {
            const Icon = t.icon
            const selected = accountType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setAccountType(t.value)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition text-center ${
                  selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={18} className={selected ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`text-[10px] font-medium leading-tight ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Campos específicos de tarjeta de crédito */}
      {isCC && (
        <div className="bg-orange-50 rounded-xl p-4 space-y-4 border border-orange-100">
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Datos de la tarjeta</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Seleccionar banco</option>
                {AR_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Red</label>
              <div className="flex gap-1.5 flex-wrap">
                {CARD_NETWORKS.map(n => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => setCardNetwork(n.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition ${
                      cardNetwork === n.value ? 'border-current' : 'border-gray-200 text-gray-400'
                    }`}
                    style={cardNetwork === n.value ? { color: n.color, borderColor: n.color, background: n.color + '15' } : {}}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Últimos 4 dígitos"
              value={lastFour}
              onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
            />
            <Input
              label="Límite de crédito"
              type="number"
              min="0"
              value={creditLimit}
              onChange={e => setCreditLimit(e.target.value)}
              placeholder="Sin límite"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vencimiento (MM/AA)"
              value={expiryDate}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                setExpiryDate(v)
              }}
              placeholder="MM/AA"
              maxLength={5}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código de seguridad</label>
              <div className="relative">
                <input
                  type={showCvv ? 'text' : 'password'}
                  value={securityCode}
                  onChange={e => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCvv(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCvv ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Día de cierre</label>
              <input
                type="number"
                min="1" max="28"
                value={closingDay}
                onChange={e => setClosingDay(e.target.value)}
                placeholder="Ej: 15"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Día de vencimiento</label>
              <input
                type="number"
                min="1" max="28"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                placeholder="Ej: 22"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Si el cierre cae en finde/feriado</label>
            <div className="flex gap-2">
              {[['before', 'Cierra día hábil anterior'], ['after', 'Cierra día hábil siguiente']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWeekendAdj(val)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border-2 transition ${
                    weekendAdj === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color de la tarjeta</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCardColor(c)}
                  className={`w-8 h-8 rounded-full border-4 transition ${cardColor === c ? 'border-white ring-2 ring-gray-400 scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <EmojiPicker value={icon} onChange={setIcon} label="Ícono de la cuenta (opcional)" />

      <Input
        label="Nombre de la cuenta"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        placeholder={
          isCC ? 'Ej: Visa Santander, Mastercard BBVA...' :
          accountType === 'cash' ? 'Ej: Efectivo pesos, Caja fuerte...' :
          accountType === 'bank' ? 'Ej: Galicia, Brubank, Santander...' :
          'Nombre de la cuenta'
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Select label="Moneda" value={currency} onChange={e => setCurrency(e.target.value)}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input
          label={info.isDebt ? '¿Cuánto debés ahora?' : '¿Cuánto tenés ahora?'}
          type="number"
          min="0"
          step="0.01"
          value={initialBalance}
          onChange={e => setInitialBalance(e.target.value)}
          placeholder="0"
        />
      </div>

      {info.isDebt && !isCC && (
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          Para cuentas de deuda, ingresá el saldo actual que debés. Se irá actualizando con tus gastos y pagos.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function Cuentas() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (isDemo(user)) {
      setAccounts(demoPaymentMethods)
      setTransactions(demoTransactions)
      setLoading(false)
      return
    }
    const [accRes, txRes] = await Promise.all([
      supabase.from('payment_methods').select('*').eq('user_id', user.id).order('name'),
      supabase.from('transactions').select('type, amount, payment_method_id').eq('user_id', user.id),
    ])
    setAccounts(accRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  const save = async (values) => {
    if (isDemo(user)) {
      if (modal?.id) {
        demoPMUpdate(modal.id, values)
        setAccounts(prev => prev.map(a => a.id === modal.id ? { ...a, ...values } : a))
      } else {
        const newAcc = { ...values, id: `pm_demo_${Date.now()}`, user_id: 'demo' }
        demoPMAdd(newAcc)
        setAccounts(prev => [...prev, newAcc])
      }
      setModal(null)
      return
    }
    let error
    if (modal?.id) {
      ;({ error } = await supabase.from('payment_methods').update(values).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('payment_methods').insert({ ...values, user_id: user.id }))
    }
    if (error) {
      alert(`Error al guardar: ${error.message}`)
      return
    }
    setModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta cuenta?')) return
    if (isDemo(user)) { demoPMRemove(id); setAccounts(prev => prev.filter(a => a.id !== id)); return }
    await supabase.from('payment_methods').delete().eq('id', id)
    load()
  }

  // Calcular saldo actual de cada cuenta
  const getBalance = (account) => {
    const initial = account.initial_balance ?? 0
    const txs = transactions.filter(t => t.payment_method_id === account.id)
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const info = typeInfo(account.account_type)
    if (info.isDebt) {
      // Para deudas: saldo sube con gastos, baja con pagos/ingresos
      return initial + expense - income
    }
    return initial + income - expense
  }

  // Totales de resumen
  const assetAccounts = accounts.filter(a => {
    const info = typeInfo(a.account_type)
    return !info.isDebt && a.account_type !== 'insurance'
  })
  const debtAccounts = accounts.filter(a => typeInfo(a.account_type).isDebt)

  const totalCapital = assetAccounts.reduce((s, a) => {
    if ((a.currency ?? 'ARS') !== 'ARS') return s // excluir otras monedas del total ARS
    return s + getBalance(a)
  }, 0)

  const totalDebt = debtAccounts.reduce((s, a) => {
    if ((a.currency ?? 'ARS') !== 'ARS') return s
    return s + getBalance(a)
  }, 0)

  const netBalance = totalCapital - totalDebt

  // Agrupar por tipo
  const grouped = ACCOUNT_TYPES.map(type => ({
    ...type,
    accounts: accounts.filter(a => (a.account_type ?? 'other') === type.value),
  })).filter(g => g.accounts.length > 0)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas</h1>
          <p className="text-gray-500 text-sm">Tu patrimonio en un vistazo</p>
        </div>
        <Button onClick={() => setModal({})} size="md">
          <Plus size={16} /> Nueva cuenta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Capital total</p>
          <p className={`font-bold text-lg ${totalCapital >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtARS(totalCapital)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">solo ARS</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Lo que debo</p>
          <p className="font-bold text-lg text-orange-500">{fmtARS(totalDebt)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">solo ARS</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Balance neto</p>
          <p className={`font-bold text-lg ${netBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {fmtARS(netBalance)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">capital − deudas</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Wallet size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Todavía no tenés cuentas</p>
          <button onClick={() => setModal({})} className="text-blue-600 text-sm mt-2 hover:underline">Crear primera cuenta</button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => {
            const GroupIcon = group.icon
            return (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${group.color}`}>
                    <GroupIcon size={13} />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.accounts.map(account => {
                    const balance = getBalance(account)
                    const info = typeInfo(account.account_type)
                    const Icon = info.icon
                    const currency = account.currency ?? 'ARS'
                    return (
                      <div key={account.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${account.icon ? 'bg-white border border-gray-200' : info.color}`}>
                              {account.icon
                                ? <IconDisplay icon={account.icon} size={24} />
                                : <Icon size={18} />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{account.name}</p>
                              <p className="text-xs text-gray-400">{info.label} · {currency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setModal(account)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-blue-600 transition">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => remove(account.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">{info.isDebt ? 'Deuda actual' : 'Saldo actual'}</span>
                          <span className={`font-bold text-base ${
                            info.isDebt
                              ? 'text-orange-500'
                              : balance >= 0 ? 'text-gray-900' : 'text-red-500'
                          }`}>
                            {info.isDebt ? '−' : ''}{fmtCurrency(Math.abs(balance), currency)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Editar cuenta' : 'Nueva cuenta'}
      >
        {modal && (
          <AccountForm
            initial={modal?.id ? modal : null}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
