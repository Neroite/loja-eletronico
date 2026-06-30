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
-- Habilite RLS e ajuste as policies conforme seu modelo de auth. As policies
-- abaixo são um ponto de partida PERMISSIVO para desenvolvimento — restrinja
-- antes de ir para produção.
-- ---------------------------------------------------------------------------

alter table public.clients  enable row level security;
alter table public.products enable row level security;
alter table public.sales    enable row level security;

-- Exemplo de DEV: libera acesso a usuários autenticados. Troque por regras reais.
create policy "dev_all_clients"  on public.clients  for all to authenticated using (true) with check (true);
create policy "dev_all_products" on public.products for all to authenticated using (true) with check (true);
create policy "dev_all_sales"    on public.sales    for all to authenticated using (true) with check (true);
