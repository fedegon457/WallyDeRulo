import { useEffect, useState } from 'react'
import {
  IconPlus, IconPencil, IconTrash,
  IconCash, IconBuilding, IconCreditCard, IconPigMoney,
  IconDeviceMobile, IconTrendingUp, IconAlertCircle, IconFileText,
  IconShield, IconDots, IconWallet, IconEye, IconEyeOff
} from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useAuth, isDemo } from '../contexts/AuthContext'
import { demoPaymentMethods, demoTransactions, demoPMAdd, demoPMUpdate, demoPMRemove } from '../lib/demoData'
import { Button } from '../components/ui/Button'
import { Input, Select, AmountInput } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { AR_BANKS, CARD_NETWORKS, CARD_COLORS, CARD_COLOR_CLASSES } from '../lib/creditCard'
import { EmojiPicker, IconDisplay } from '../components/ui/EmojiPicker'
import { fmt as fmtARS } from '../lib/fmt'

// Main account types — debit_card excluded (created via bank account)
const ACCOUNT_TYPES = [
  { value: 'cash',        label: 'Efectivo',           icon: IconCash,         color: 'bg-emerald-100 text-emerald-700', isDebt: false },
  { value: 'bank',        label: 'Banco',              icon: IconBuilding,     color: 'bg-primary-100 text-primary-700', isDebt: false },
  { value: 'savings',     label: 'Ahorro',             icon: IconPigMoney,     color: 'bg-primary-100 text-primary-700', isDebt: false },
  { value: 'e_payment',   label: 'Pago electronico',   icon: IconDeviceMobile, color: 'bg-violet-100 text-violet-700',   isDebt: false },
  { value: 'investment',  label: 'Inversion',          icon: IconTrendingUp,   color: 'bg-yellow-100 text-yellow-700',   isDebt: false },
  { value: 'credit_card', label: 'Tarjeta de credito', icon: IconCreditCard,   color: 'bg-orange-100 text-orange-700',   isDebt: true  },
  { value: 'credit_line', label: 'Linea de credito',   icon: IconAlertCircle,  color: 'bg-red-100 text-red-700',         isDebt: true  },
  { value: 'loan',        label: 'Prestamo',           icon: IconFileText,     color: 'bg-rose-100 text-rose-700',       isDebt: true  },
  { value: 'insurance',   label: 'Seguro',             icon: IconShield,       color: 'bg-gray-100 text-gray-600',       isDebt: false },
  { value: 'other',       label: 'Otros',              icon: IconDots,         color: 'bg-gray-100 text-gray-600',       isDebt: false },
]

const DEBIT_TYPE = { value: 'debit_card', label: 'Tarjeta de debito', icon: IconCreditCard, color: 'bg-cyan-100 text-cyan-700', isDebt: false }

const ALL_TYPES = [ACCOUNT_TYPES[0], ACCOUNT_TYPES[1], DEBIT_TYPE, ...ACCOUNT_TYPES.slice(2)]

const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL', 'UYU']

const typeInfo = (value) => ALL_TYPES.find(t => t.value === value) ?? ALL_TYPES[ALL_TYPES.length - 1]

function fmtCurrency(n, currency = 'ARS') {
  if (currency === 'ARS') return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}


// ─── Formulario tarjeta de debito ─────────────────────────────────────────────

function DebitCardForm({ parentAccount, initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [lastFour, setLastFour] = useState(initial?.last_four ?? '')
  const [cardNetwork, setCardNetwork] = useState(initial?.card_network ?? 'visa')
  const [cardColor, setCardColor] = useState(initial?.card_color ?? CARD_COLORS[0])
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        account_type: 'debit_card',
        currency: parentAccount?.currency ?? 'ARS',
        initial_balance: 0,
        type: 'immediate',
        parent_account_id: parentAccount?.id ?? initial?.parent_account_id ?? null,
        last_four: lastFour || null,
        card_network: cardNetwork || null,
        card_color: cardColor,
        icon: icon || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {parentAccount && (
        <div className="bg-cyan-50 rounded-xl px-4 py-3 text-sm text-cyan-700 border border-cyan-100">
          Vinculada a <strong>{parentAccount.name}</strong>. El saldo se comparte con la cuenta banco.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Red de pago</label>
        <div className="flex gap-2 flex-wrap">
          {CARD_NETWORKS.map(n => (
            <button
              key={n.value}
              type="button"
              onClick={() => setCardNetwork(n.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${cardNetwork === n.value ? n.activeClass : 'border-gray-200 text-gray-400'}`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Ultimos 4 digitos (opcional)"
        value={lastFour}
        onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="0000"
        inputMode="numeric"
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setCardColor(c)}
              className={`w-8 h-8 rounded-full border-4 transition ${CARD_COLOR_CLASSES[i]} ${cardColor === c ? 'border-white ring-2 ring-gray-400 scale-110' : 'border-transparent'}`}
            />
          ))}
        </div>
      </div>

      <EmojiPicker value={icon} onChange={setIcon} label="Icono (opcional)" />

      <Input
        label="Nombre de la tarjeta"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        placeholder="Ej: Visa Galicia, Maestro Santander..."
      />

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

// ─── Formulario de cuenta ─────────────────────────────────────────────────────

function AccountForm({ initial, onSave, onCancel }) {
  const [accountType, setAccountType] = useState(initial?.account_type ?? 'bank')
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'ARS')
  const [initialBalance, setInitialBalance] = useState(initial?.initial_balance ?? '')
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
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition text-center ${selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Icon size={18} className={selected ? 'text-primary-600' : 'text-gray-400'} />
                <span className={`text-[10px] font-medium leading-tight ${selected ? 'text-primary-700' : 'text-gray-500'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
        {accountType === 'bank' && (
          <p className="mt-2 text-[11px] text-gray-400">Podas agregar tarjetas de debito vinculadas desde la vista de cuentas.</p>
        )}
      </div>

      {isCC && (
        <div className="bg-orange-50 rounded-xl p-4 space-y-4 border border-orange-100">
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Datos de la tarjeta</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition ${cardNetwork === n.value ? n.activeClass : 'border-gray-200 text-gray-400'}`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ultimos 4 digitos"
              value={lastFour}
              onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
            />
            <AmountInput
              label="Limite de credito"
              value={creditLimit}
              onChange={setCreditLimit}
              placeholder="Sin limite"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Codigo de seguridad</label>
              <div className="relative">
                <input
                  type={showCvv ? 'text' : 'password'}
                  value={securityCode}
                  onChange={e => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCvv(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCvv ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de cierre</label>
              <input type="number" min="1" max="28" value={closingDay} onChange={e => setClosingDay(e.target.value)} placeholder="Ej: 15" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de vencimiento</label>
              <input type="number" min="1" max="28" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="Ej: 22" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Si el cierre cae en finde/feriado</label>
            <div className="flex gap-2">
              {[['before', 'Cierra dia habil anterior'], ['after', 'Cierra dia habil siguiente']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => setWeekendAdj(val)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border-2 transition ${weekendAdj === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'}`}>{lbl}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color de la tarjeta</label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c, i) => (
                <button key={c} type="button" onClick={() => setCardColor(c)} className={`w-8 h-8 rounded-full border-4 transition ${CARD_COLOR_CLASSES[i]} ${cardColor === c ? 'border-white ring-2 ring-gray-400 scale-110' : 'border-transparent'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <EmojiPicker value={icon} onChange={setIcon} label="Icono de la cuenta (opcional)" />

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
        <AmountInput
          label={info.isDebt ? 'Cuanto debes ahora?' : 'Cuanto tenes ahora?'}
          value={initialBalance}
          onChange={setInitialBalance}
          placeholder="0"
        />
      </div>

      {info.isDebt && !isCC && (
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          Para cuentas de deuda, ingresa el saldo actual que debes. Se ira actualizando con tus gastos y pagos.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}

// ─── Pagina principal ─────────────────────────────────────────────────────────

export function Cuentas() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [modal, setModal] = useState(null)
  const [debitModal, setDebitModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (isDemo(user)) {
      setAccounts(demoPaymentMethods)
      setTransactions(demoTransactions)
      setLoading(false)
      return
    }
    const [accRes, txRes] = await Promise.all([
      supabase.from('payment_methods').select('id, name, account_type, currency, initial_balance, type, icon, parent_account_id, card_color, last_four, card_network, closing_day, due_day, credit_limit, bank_name, weekend_adjustment, expiry_date, security_code').eq('user_id', user.id).order('name'),
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
      ;({ error } = await supabase.from('payment_methods').update(values).eq('id', modal.id).eq('user_id', user.id))
    } else {
      ;({ error } = await supabase.from('payment_methods').insert({ ...values, user_id: user.id }))
    }
    if (error) { alert(`Error al guardar: ${error.message}`); return }
    setModal(null)
    load()
  }

  const saveDebitCard = async (values) => {
    const card = debitModal?.card
    if (isDemo(user)) {
      if (card?.id) {
        demoPMUpdate(card.id, values)
        setAccounts(prev => prev.map(a => a.id === card.id ? { ...a, ...values } : a))
      } else {
        const newCard = { ...values, id: `pm_demo_${Date.now()}`, user_id: 'demo' }
        demoPMAdd(newCard)
        setAccounts(prev => [...prev, newCard])
      }
      setDebitModal(null)
      return
    }
    let error
    if (card?.id) {
      ;({ error } = await supabase.from('payment_methods').update(values).eq('id', card.id).eq('user_id', user.id))
    } else {
      ;({ error } = await supabase.from('payment_methods').insert({ ...values, user_id: user.id }))
    }
    if (error) { alert(`Error al guardar: ${error.message}`); return }
    setDebitModal(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Eliminar esta cuenta?')) return
    if (isDemo(user)) { demoPMRemove(id); setAccounts(prev => prev.filter(a => a.id !== id)); return }
    await supabase.from('payment_methods').delete().eq('id', id).eq('user_id', user.id)
    load()
  }

  const getBalance = (account) => {
    const initial = account.initial_balance ?? 0
    const info = typeInfo(account.account_type)
    const relevantIds = new Set([account.id])
    if (account.account_type === 'bank') {
      accounts.filter(a => a.parent_account_id === account.id).forEach(a => relevantIds.add(a.id))
    }
    const txs = transactions.filter(t => relevantIds.has(t.payment_method_id))
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount ?? 0), 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount ?? 0), 0)
    if (info.isDebt) return initial + expense - income
    return initial + income - expense
  }

  const debitsByParent = {}
  accounts.forEach(a => {
    if (a.account_type === 'debit_card' && a.parent_account_id) {
      if (!debitsByParent[a.parent_account_id]) debitsByParent[a.parent_account_id] = []
      debitsByParent[a.parent_account_id].push(a)
    }
  })

  const orphanDebits = accounts.filter(a => a.account_type === 'debit_card' && !a.parent_account_id)

  const assetAccounts = accounts.filter(a => {
    const info = typeInfo(a.account_type)
    return !info.isDebt && a.account_type !== 'insurance' && !a.parent_account_id
  })
  const debtAccounts = accounts.filter(a => typeInfo(a.account_type).isDebt)

  const totalCapital = assetAccounts.reduce((s, a) => (a.currency ?? 'ARS') !== 'ARS' ? s : s + getBalance(a), 0)
  const totalDebt = debtAccounts.reduce((s, a) => (a.currency ?? 'ARS') !== 'ARS' ? s : s + getBalance(a), 0)
  const netBalance = totalCapital - totalDebt

  const grouped = ACCOUNT_TYPES.map(type => ({
    ...type,
    accounts: accounts.filter(a => (a.account_type ?? 'other') === type.value),
  })).filter(g => g.accounts.length > 0)

  if (orphanDebits.length > 0) {
    grouped.push({ ...DEBIT_TYPE, accounts: orphanDebits })
  }

  const networkLabel = (val) => CARD_NETWORKS.find(n => n.value === val)?.label ?? val

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
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
          <IconPlus size={16} /> Nueva cuenta
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Capital total</p>
          <p className={`font-bold text-lg ${totalCapital >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtARS(totalCapital)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">solo ARS</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Lo que debo</p>
          <p className="font-bold text-lg text-orange-500">{fmtARS(totalDebt)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">solo ARS</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Balance neto</p>
          <p className={`font-bold text-lg ${netBalance >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{fmtARS(netBalance)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">capital menos deudas</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconWallet size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Todavia no tenes cuentas</p>
          <button onClick={() => setModal({})} className="text-primary-600 text-sm mt-2 hover:underline">Crear primera cuenta</button>
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
                    const linkedCards = debitsByParent[account.id] ?? []
                    const isBank = account.account_type === 'bank'
                    const isOrphanDebit = account.account_type === 'debit_card' && !account.parent_account_id

                    return (
                      <div key={account.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${account.icon ? 'bg-white border border-gray-200' : info.color}`}>
                              {account.icon ? <IconDisplay icon={account.icon} size={24} /> : <Icon size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{account.name}</p>
                              <p className="text-xs text-gray-400">{info.label} · {currency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => isOrphanDebit ? setDebitModal({ parent: null, card: account }) : setModal(account)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-primary-600 transition"
                            >
                              <IconPencil size={14} />
                            </button>
                            <button onClick={() => remove(account.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-red-500 transition">
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">{info.isDebt ? 'Deuda actual' : 'Saldo actual'}</span>
                          <span className={`font-bold text-base ${info.isDebt ? 'text-orange-500' : balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                            {info.isDebt ? '-' : ''}{fmtCurrency(Math.abs(balance), currency)}
                          </span>
                        </div>

                        {isBank && (
                          <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                            {linkedCards.map(card => (
                              <div key={card.id} className="flex items-center gap-2 text-xs text-gray-500 group">
                                {/* GGA exception: DB-stored card_color is a user-picked arbitrary hex */}
                              <div className="w-6 h-4 rounded flex-shrink-0 border border-black/10" style={{ background: card.card_color ?? '#94a3b8' }} />
                                <span className="flex-1 truncate">
                                  {card.name}
                                  {card.last_four && <span className="text-gray-400 ml-1">&bull;{card.last_four}</span>}
                                  {card.card_network && <span className="text-gray-400 ml-1 capitalize">{networkLabel(card.card_network)}</span>}
                                </span>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => setDebitModal({ parent: account, card })} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition">
                                    <IconPencil size={12} />
                                  </button>
                                  <button onClick={() => remove(card.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition">
                                    <IconTrash size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => setDebitModal({ parent: account, card: null })}
                              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-700 transition font-medium"
                            >
                              <IconPlus size={12} />
                              Agregar tarjeta de debito
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar cuenta' : 'Nueva cuenta'}>
        {modal && (
          <AccountForm
            initial={modal?.id ? modal : null}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!debitModal}
        onClose={() => setDebitModal(null)}
        title={debitModal?.card?.id ? 'Editar tarjeta de debito' : 'Nueva tarjeta de debito'}
      >
        {debitModal && (
          <DebitCardForm
            parentAccount={debitModal.parent}
            initial={debitModal.card ?? null}
            onSave={saveDebitCard}
            onCancel={() => setDebitModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
