-- ============================================================
-- FINANZAPP - Schema para Supabase
-- Ejecutar este SQL completo en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- -----------------------------------------------
-- CATEGORÍAS (con soporte de subcategorías)
-- -----------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  parent_id uuid references categories(id) on delete cascade,
  created_at timestamptz default now()
);

alter table categories enable row level security;
create policy "Users manage own categories" on categories
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- MÉTODOS DE PAGO
-- -----------------------------------------------
create table payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('immediate', 'credit')),
  account_type text default 'other' check (account_type in (
    'cash', 'bank', 'debit_card', 'savings', 'e_payment', 'investment',
    'credit_card', 'credit_line', 'loan', 'insurance', 'other'
  )),
  currency text default 'ARS',
  initial_balance numeric(12,2) default 0,
  created_at timestamptz default now()
);

alter table payment_methods enable row level security;
create policy "Users manage own payment methods" on payment_methods
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- TRANSACCIONES
-- -----------------------------------------------
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  category_id uuid references categories(id) on delete set null,
  payment_method_id uuid references payment_methods(id) on delete set null,
  notes text,
  transfer_group_id uuid,
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Users manage own transactions" on transactions
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- GASTOS COMPARTIDOS
-- -----------------------------------------------
create table shared_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  total_amount numeric(12,2) not null check (total_amount > 0),
  date date not null,
  notes text,
  paid_by_me boolean default true,
  paid_by_name text,
  user_share numeric(12,2),
  user_paid_back boolean default false,
  user_paid_back_date date,
  user_paid_back_notes text,
  category_id uuid references categories(id) on delete set null,
  payment_method_id uuid references payment_methods(id) on delete set null,
  created_at timestamptz default now()
);

alter table shared_expenses enable row level security;
create policy "Users manage own shared expenses" on shared_expenses
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- PARTICIPANTES DE GASTOS COMPARTIDOS
-- -----------------------------------------------
create table shared_expense_participants (
  id uuid primary key default uuid_generate_v4(),
  shared_expense_id uuid references shared_expenses(id) on delete cascade not null,
  name text not null,
  amount_owed numeric(12,2) not null check (amount_owed >= 0),
  created_at timestamptz default now()
);

alter table shared_expense_participants enable row level security;
create policy "Users manage participants via shared expenses" on shared_expense_participants
  for all using (
    exists (
      select 1 from shared_expenses
      where id = shared_expense_participants.shared_expense_id
      and user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- PAGOS DE PARTICIPANTES
-- -----------------------------------------------
create table shared_expense_payments (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references shared_expense_participants(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table shared_expense_payments enable row level security;
create policy "Users manage payments via participants" on shared_expense_payments
  for all using (
    exists (
      select 1 from shared_expense_participants sep
      join shared_expenses se on se.id = sep.shared_expense_id
      where sep.id = shared_expense_payments.participant_id
      and se.user_id = auth.uid()
    )
  );

-- -----------------------------------------------
-- GASTOS FIJOS (suscripciones, abonos, etc.)
-- -----------------------------------------------
create table recurring_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null check (frequency in ('monthly', 'yearly', 'weekly')),
  day_of_month integer check (day_of_month between 1 and 31),
  category_id uuid references categories(id) on delete set null,
  payment_method_id uuid references payment_methods(id) on delete set null,
  icon text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table recurring_expenses enable row level security;
create policy "Users manage own recurring expenses" on recurring_expenses
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- PAGOS DE GASTOS FIJOS
-- -----------------------------------------------
create table recurring_expense_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recurring_expense_id uuid references recurring_expenses(id) on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  date date not null,
  period text not null,
  notes text,
  created_at timestamptz default now()
);

alter table recurring_expense_payments enable row level security;
create policy "Users manage own recurring payments" on recurring_expense_payments
  for all using (auth.uid() = user_id);

-- -----------------------------------------------
-- ÍNDICES PARA PERFORMANCE
-- -----------------------------------------------
create index idx_transactions_user_date on transactions(user_id, date desc);
create index idx_categories_user on categories(user_id);
create index idx_payment_methods_user on payment_methods(user_id);
create index idx_shared_expenses_user on shared_expenses(user_id);
create index idx_recurring_expenses_user on recurring_expenses(user_id);
create index idx_recurring_payments_user_period on recurring_expense_payments(user_id, period);
