-- ByteFlow Pro — schema do Supabase
-- Rode no SQL Editor do painel do Supabase (ou via `supabase db push`).
-- Mantém paridade com src/types.ts (colunas em snake_case).

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.clients (
  id           text primary key,            -- ex.: #CLI-001
  name         text not null,
  contact_name text,
  doc          text,                         -- CPF ou CNPJ
  email        text,
  phone        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,             -- SKU, ex.: #TECH-1001
  name        text not null,
  category    text not null,
  stock_level integer not null default 0 check (stock_level >= 0),
  max_stock   integer not null check (max_stock >= 1),
  status      text not null,                -- 'Em Estoque' | 'Estoque Baixo' | 'Crítico'
  cost_price  numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price  numeric(12,2) not null default 0 check (sale_price >= 0)
);

-- coluna criada à parte para manter a ordem de leitura próxima de src/types.ts
alter table public.products add column if not exists image_url text not null default '';

create table if not exists public.sales (
  id             text primary key,          -- ex.: #BF-10824
  created_at     timestamptz not null default now(),
  client_id      text references public.clients (id) on delete set null,
  client_name    text not null,             -- snapshot (walk-in = 'Consumidor Final')
  client_doc     text not null default 'N/A',
  seller         text not null,
  payment_method text not null,             -- 'Cartão Crédito' | 'PIX' | 'Dinheiro' | 'Debito'
  total_value    numeric(12,2) not null default 0,
  status         text not null,             -- 'Pago' | 'Aguard. Retirada' | 'Cancelado'
  items          jsonb not null default '[]'::jsonb  -- array de SaleItem
);

create index if not exists sales_client_id_idx on public.sales (client_id);
create index if not exists sales_created_at_idx on public.sales (created_at desc);
create index if not exists products_category_idx on public.products (category);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ByteFlow Pro has no per-user/per-store data ownership — every authenticated
-- user is store staff with full read/write access, anonymous users have none
-- (RLS default-deny with no policy for the `anon` role). Policies are split
-- per operation (rather than a single FOR ALL) for clarity, not to change
-- behavior. If per-role restrictions (e.g. only Admin can delete) are ever
-- needed, that requires a staff/role table this schema doesn't have yet.
-- ---------------------------------------------------------------------------

alter table public.clients  enable row level security;
alter table public.products enable row level security;
alter table public.sales    enable row level security;

create policy "clients_select" on public.clients for select to authenticated using (true);
create policy "clients_insert" on public.clients for insert to authenticated with check (true);
create policy "clients_update" on public.clients for update to authenticated using (true) with check (true);
create policy "clients_delete" on public.clients for delete to authenticated using (true);

create policy "products_select" on public.products for select to authenticated using (true);
create policy "products_insert" on public.products for insert to authenticated with check (true);
create policy "products_update" on public.products for update to authenticated using (true) with check (true);
create policy "products_delete" on public.products for delete to authenticated using (true);

create policy "sales_select" on public.sales for select to authenticated using (true);
create policy "sales_insert" on public.sales for insert to authenticated with check (true);
create policy "sales_update" on public.sales for update to authenticated using (true) with check (true);
create policy "sales_delete" on public.sales for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Stock movements (histórico de movimentação de estoque)
-- ---------------------------------------------------------------------------

create table if not exists public.stock_movements (
  id              text primary key,
  product_id      text not null references public.products (id) on delete cascade,
  product_name    text not null,
  type            text not null,        -- 'venda' | 'estorno' | 'reposição' | 'ajuste' | 'cadastro'
  delta           integer not null,     -- + entrada / - saída
  resulting_stock integer not null,     -- stock level after this movement
  reason          text,                 -- free-text for manual adjustments
  created_at      timestamptz not null default now()
);

create index if not exists movements_product_id_idx on public.stock_movements (product_id);
create index if not exists movements_created_at_idx  on public.stock_movements (created_at desc);

alter table public.stock_movements enable row level security;
create policy "stock_movements_select" on public.stock_movements for select to authenticated using (true);
create policy "stock_movements_insert" on public.stock_movements for insert to authenticated with check (true);
create policy "stock_movements_update" on public.stock_movements for update to authenticated using (true) with check (true);
create policy "stock_movements_delete" on public.stock_movements for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Store settings (single-row config — this app has no multi-tenancy, so
-- there is exactly one settings row, enforced by the `id = 'singleton'` check)
-- ---------------------------------------------------------------------------

create table if not exists public.store_settings (
  id            text primary key default 'singleton',
  store_name    text not null default 'ByteFlow Pro',
  store_segment text not null default 'Informática & Eletrônicos',
  updated_at    timestamptz not null default now(),
  constraint store_settings_singleton check (id = 'singleton')
);

alter table public.store_settings enable row level security;
create policy "store_settings_select" on public.store_settings for select to authenticated using (true);
create policy "store_settings_update" on public.store_settings for update to authenticated using (true) with check (true);
-- No insert/delete policy for `authenticated`: the singleton row is seeded once below,
-- the app only ever updates it.

insert into public.store_settings (id, store_name, store_segment)
values ('singleton', 'ByteFlow Pro', 'Informática & Eletrônicos')
on conflict (id) do nothing;
