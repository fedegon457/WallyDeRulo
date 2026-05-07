import { format, subDays, subMonths, startOfMonth } from 'date-fns'

export const DEMO_USER = { id: 'demo', email: 'demo@wallyderulo.com' }

export const demoCategories = [
  { id: 'c1',  user_id: 'demo', name: 'Salud',          type: 'expense', parent_id: null,  icon: '🏥' },
  { id: 'c2',  user_id: 'demo', name: 'Nutricionista',  type: 'expense', parent_id: 'c1',  icon: '🥗' },
  { id: 'c3',  user_id: 'demo', name: 'Médico',         type: 'expense', parent_id: 'c1',  icon: '🩺' },
  { id: 'c4',  user_id: 'demo', name: 'Psicóloga',      type: 'expense', parent_id: 'c1',  icon: '🧠' },
  { id: 'c5',  user_id: 'demo', name: 'Comida',         type: 'expense', parent_id: null,  icon: '🍕' },
  { id: 'c6',  user_id: 'demo', name: 'Supermercado',   type: 'expense', parent_id: 'c5',  icon: '🛒' },
  { id: 'c7',  user_id: 'demo', name: 'Restaurante',    type: 'expense', parent_id: 'c5',  icon: '🍔' },
  { id: 'c8',  user_id: 'demo', name: 'Transporte',     type: 'expense', parent_id: null,  icon: '🚗' },
  { id: 'c9',  user_id: 'demo', name: 'Entretenimiento',type: 'expense', parent_id: null,  icon: '🎬' },
  { id: 'c10', user_id: 'demo', name: 'Comisiones',     type: 'income',  parent_id: null,  icon: '💼' },
  { id: 'c11', user_id: 'demo', name: 'Abono',          type: 'income',  parent_id: 'c10', icon: '📈' },
  { id: 'c12', user_id: 'demo', name: 'Implementación', type: 'income',  parent_id: 'c10', icon: '🤝' },
  { id: 'c13', user_id: 'demo', name: 'Equipos',        type: 'income',  parent_id: 'c10', icon: '💻' },
  { id: 'c14', user_id: 'demo', name: 'Sueldo',         type: 'income',  parent_id: null,  icon: '💵' },
]

export const demoPaymentMethods = [
  { id: 'pm1', user_id: 'demo', name: 'Efectivo pesos',    type: 'immediate', account_type: 'cash',        currency: 'ARS', initial_balance: 15000  },
  { id: 'pm2', user_id: 'demo', name: 'Galicia',           type: 'immediate', account_type: 'bank',        currency: 'ARS', initial_balance: 250000 },
  { id: 'pm3', user_id: 'demo', name: 'Brubank',           type: 'immediate', account_type: 'bank',        currency: 'ARS', initial_balance: 80000  },
  { id: 'pm4', user_id: 'demo', name: 'Visa Santander',    type: 'credit',    account_type: 'credit_card', currency: 'ARS', initial_balance: 45000  },
  { id: 'pm5', user_id: 'demo', name: 'Mastercard BBVA',   type: 'credit',    account_type: 'credit_card', currency: 'ARS', initial_balance: 20000  },
  { id: 'pm6', user_id: 'demo', name: 'Caja de ahorro USD',type: 'immediate', account_type: 'savings',     currency: 'USD', initial_balance: 1200   },
]

const d = (daysAgo) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const m = (monthsAgo, day) => format(new Date(new Date().getFullYear(), new Date().getMonth() - monthsAgo, day), 'yyyy-MM-dd')

export const demoTransactions = [
  // Este mes
  { id: 't1',  user_id:'demo', type:'income',  amount:320000, date:d(2),  category_id:'c11', payment_method_id:'pm3', notes:'Abono cliente A', categories:{id:'c11',name:'Abono',type:'income',parent_id:'c10'},        payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't2',  user_id:'demo', type:'income',  amount:180000, date:d(3),  category_id:'c12', payment_method_id:'pm3', notes:'Implementación TechCo', categories:{id:'c12',name:'Implementación',type:'income',parent_id:'c10'}, payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't3',  user_id:'demo', type:'expense', amount:25000,  date:d(1),  category_id:'c6',  payment_method_id:'pm2', notes:'Carrefour', categories:{id:'c6',name:'Supermercado',type:'expense',parent_id:'c5'},       payment_methods:{id:'pm2',name:'Débito Galicia',type:'immediate'} },
  { id: 't4',  user_id:'demo', type:'expense', amount:8500,   date:d(2),  category_id:'c2',  payment_method_id:'pm4', notes:'Nutricionista', categories:{id:'c2',name:'Nutricionista',type:'expense',parent_id:'c1'},  payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't5',  user_id:'demo', type:'expense', amount:12000,  date:d(4),  category_id:'c7',  payment_method_id:'pm4', notes:'Lo de Carlitos', categories:{id:'c7',name:'Restaurante',type:'expense',parent_id:'c5'},    payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't6',  user_id:'demo', type:'expense', amount:4200,   date:d(5),  category_id:'c8',  payment_method_id:'pm1', notes:'SUBE + Uber', categories:{id:'c8',name:'Transporte',type:'expense',parent_id:null},       payment_methods:{id:'pm1',name:'Efectivo',type:'immediate'} },
  { id: 't7',  user_id:'demo', type:'expense', amount:15000,  date:d(6),  category_id:'c4',  payment_method_id:'pm4', notes:'Psicóloga', categories:{id:'c4',name:'Psicóloga',type:'expense',parent_id:'c1'},         payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't8',  user_id:'demo', type:'income',  amount:95000,  date:d(7),  category_id:'c13', payment_method_id:'pm3', notes:'Equipos cliente B', categories:{id:'c13',name:'Equipos',type:'income',parent_id:'c10'},  payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't9',  user_id:'demo', type:'expense', amount:9800,   date:d(8),  category_id:'c9',  payment_method_id:'pm5', notes:'Cine + cena', categories:{id:'c9',name:'Entretenimiento',type:'expense',parent_id:null},  payment_methods:{id:'pm5',name:'Mastercard BBVA',type:'credit'} },
  { id: 't10', user_id:'demo', type:'expense', amount:22000,  date:d(10), category_id:'c6',  payment_method_id:'pm2', notes:'Día', categories:{id:'c6',name:'Supermercado',type:'expense',parent_id:'c5'},           payment_methods:{id:'pm2',name:'Débito Galicia',type:'immediate'} },
  // Mes anterior
  { id: 't11', user_id:'demo', type:'income',  amount:300000, date:m(1,5),  category_id:'c11', payment_method_id:'pm3', notes:'Abono cliente A', categories:{id:'c11',name:'Abono',type:'income',parent_id:'c10'},    payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't12', user_id:'demo', type:'income',  amount:150000, date:m(1,10), category_id:'c11', payment_method_id:'pm3', notes:'Abono cliente C', categories:{id:'c11',name:'Abono',type:'income',parent_id:'c10'},    payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't13', user_id:'demo', type:'expense', amount:28000,  date:m(1,8),  category_id:'c6',  payment_method_id:'pm2', notes:'Supermercado', categories:{id:'c6',name:'Supermercado',type:'expense',parent_id:'c5'}, payment_methods:{id:'pm2',name:'Débito Galicia',type:'immediate'} },
  { id: 't14', user_id:'demo', type:'expense', amount:8500,   date:m(1,15), category_id:'c2',  payment_method_id:'pm4', notes:'Nutricionista', categories:{id:'c2',name:'Nutricionista',type:'expense',parent_id:'c1'},payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't15', user_id:'demo', type:'expense', amount:15000,  date:m(1,20), category_id:'c4',  payment_method_id:'pm4', notes:'Psicóloga', categories:{id:'c4',name:'Psicóloga',type:'expense',parent_id:'c1'},      payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't16', user_id:'demo', type:'expense', amount:18000,  date:m(1,22), category_id:'c7',  payment_method_id:'pm4', notes:'Salida con amigos', categories:{id:'c7',name:'Restaurante',type:'expense',parent_id:'c5'},payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't17', user_id:'demo', type:'expense', amount:5000,   date:m(1,25), category_id:'c8',  payment_method_id:'pm1', notes:'Transporte', categories:{id:'c8',name:'Transporte',type:'expense',parent_id:null},    payment_methods:{id:'pm1',name:'Efectivo',type:'immediate'} },
  // 2 meses atrás
  { id: 't18', user_id:'demo', type:'income',  amount:280000, date:m(2,5),  category_id:'c11', payment_method_id:'pm3', notes:'Abono cliente A', categories:{id:'c11',name:'Abono',type:'income',parent_id:'c10'},    payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't19', user_id:'demo', type:'income',  amount:210000, date:m(2,12), category_id:'c12', payment_method_id:'pm3', notes:'Implementación', categories:{id:'c12',name:'Implementación',type:'income',parent_id:'c10'},payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't20', user_id:'demo', type:'expense', amount:30000,  date:m(2,7),  category_id:'c6',  payment_method_id:'pm2', notes:'Supermercado', categories:{id:'c6',name:'Supermercado',type:'expense',parent_id:'c5'}, payment_methods:{id:'pm2',name:'Débito Galicia',type:'immediate'} },
  { id: 't21', user_id:'demo', type:'expense', amount:8500,   date:m(2,15), category_id:'c2',  payment_method_id:'pm4', notes:'Nutricionista', categories:{id:'c2',name:'Nutricionista',type:'expense',parent_id:'c1'},payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  { id: 't22', user_id:'demo', type:'expense', amount:15000,  date:m(2,18), category_id:'c4',  payment_method_id:'pm4', notes:'Psicóloga', categories:{id:'c4',name:'Psicóloga',type:'expense',parent_id:'c1'},      payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
  // 3 meses atrás
  { id: 't23', user_id:'demo', type:'income',  amount:295000, date:m(3,5),  category_id:'c11', payment_method_id:'pm3', notes:'Abono cliente A', categories:{id:'c11',name:'Abono',type:'income',parent_id:'c10'},    payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't24', user_id:'demo', type:'income',  amount:80000,  date:m(3,18), category_id:'c13', payment_method_id:'pm3', notes:'Equipos', categories:{id:'c13',name:'Equipos',type:'income',parent_id:'c10'},         payment_methods:{id:'pm3',name:'Transferencia',type:'immediate'} },
  { id: 't25', user_id:'demo', type:'expense', amount:27000,  date:m(3,8),  category_id:'c6',  payment_method_id:'pm2', notes:'Supermercado', categories:{id:'c6',name:'Supermercado',type:'expense',parent_id:'c5'}, payment_methods:{id:'pm2',name:'Débito Galicia',type:'immediate'} },
  { id: 't26', user_id:'demo', type:'expense', amount:12000,  date:m(3,14), category_id:'c3',  payment_method_id:'pm4', notes:'Médico clínico', categories:{id:'c3',name:'Médico',type:'expense',parent_id:'c1'},     payment_methods:{id:'pm4',name:'Visa Santander',type:'credit'} },
]

export const demoRecurringExpenses = [
  { id: 're1', user_id: 'demo', name: 'Netflix',  amount: 8000,  frequency: 'monthly', day_of_month: 15, category_id: 'c9',  payment_method_id: 'pm4', notes: '', icon: '🎬', is_active: true },
  { id: 're2', user_id: 'demo', name: 'Gym',      amount: 25000, frequency: 'monthly', day_of_month: 1,  category_id: 'c1',  payment_method_id: 'pm2', notes: '', icon: '🏋️', is_active: true },
  { id: 're3', user_id: 'demo', name: 'Spotify',  amount: 5000,  frequency: 'monthly', day_of_month: 10, category_id: 'c9',  payment_method_id: 'pm4', notes: '', icon: '🎵', is_active: true },
  { id: 're4', user_id: 'demo', name: 'Club',     amount: 40000, frequency: 'monthly', day_of_month: 5,  category_id: 'c1',  payment_method_id: 'pm3', notes: '', icon: '⚽', is_active: true },
]

export const demoSharedExpenses = [
  {
    id: 'se1', user_id: 'demo',
    description: 'Cena cumpleaños Rodrigo',
    total_amount: 48000, date: d(5), notes: 'Fuimos al Don Julio',
    participants: [
      { id: 'p1', shared_expense_id: 'se1', name: 'Martín',  amount_owed: 12000,
        payments: [{ id: 'pay1', participant_id: 'p1', amount: 12000, date: d(3), notes: 'Transferencia' }] },
      { id: 'p2', shared_expense_id: 'se1', name: 'Lucía',   amount_owed: 12000, payments: [] },
      { id: 'p3', shared_expense_id: 'se1', name: 'Tomás',   amount_owed: 12000,
        payments: [{ id: 'pay2', participant_id: 'p3', amount: 6000, date: d(4), notes: 'En efectivo' }] },
      { id: 'p4', shared_expense_id: 'se1', name: 'Sofi',    amount_owed: 12000, payments: [] },
    ],
  },
  {
    id: 'se2', user_id: 'demo',
    description: 'Alquiler casa en Pinamar',
    total_amount: 120000, date: m(1, 15), notes: 'Finde largo enero',
    participants: [
      { id: 'p5', shared_expense_id: 'se2', name: 'Guille',  amount_owed: 40000,
        payments: [{ id: 'pay3', participant_id: 'p5', amount: 40000, date: m(1, 20), notes: '' }] },
      { id: 'p6', shared_expense_id: 'se2', name: 'Caro',    amount_owed: 40000,
        payments: [{ id: 'pay4', participant_id: 'p6', amount: 40000, date: m(1, 18), notes: '' }] },
      { id: 'p7', shared_expense_id: 'se2', name: 'Lean',    amount_owed: 40000,
        payments: [{ id: 'pay5', participant_id: 'p7', amount: 40000, date: m(1, 22), notes: 'Transferencia' }] },
    ],
  },
  {
    id: 'se3', user_id: 'demo',
    description: 'Asado en lo de Pablo',
    total_amount: 35000, date: d(15), notes: '',
    participants: [
      { id: 'p8',  shared_expense_id: 'se3', name: 'Pablo',  amount_owed: 8750, payments: [] },
      { id: 'p9',  shared_expense_id: 'se3', name: 'Nico',   amount_owed: 8750, payments: [] },
      { id: 'p10', shared_expense_id: 'se3', name: 'Juli',   amount_owed: 8750,
        payments: [{ id: 'pay6', participant_id: 'p10', amount: 8750, date: d(12), notes: '' }] },
      { id: 'p11', shared_expense_id: 'se3', name: 'Fer',    amount_owed: 8750, payments: [] },
    ],
  },
]
