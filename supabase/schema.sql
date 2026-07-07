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
-- RBAC — profiles + current_user_role()
-- admin: acesso total, incl. Configurações e gerenciar role de outros usuários.
-- editor: cria/edita produtos, vendas, clientes, estoque — sem excluir, sem
-- Configurações. user: somente leitura. Precisa existir antes das policies
-- de insert/update/delete abaixo, que chamam current_user_role().
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'user' check (role in ('admin','editor','user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-provisiona uma linha profiles (role default 'user') para todo novo auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger function é só para uso interno — nunca deve ser chamável via RPC.
revoke execute on function public.handle_new_user() from anon, authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Precisa ser executável por authenticated (usada dentro das policies abaixo,
-- avaliadas no contexto do papel que faz a query); anon não deve chamá-la.
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
-- Sem insert/delete policy para authenticated: linhas só são criadas pela
-- trigger (security definer) ou por um backfill único ao adotar RBAC numa
-- base existente: insert into profiles select id, email, 'admin' from auth.users
-- on conflict (id) do nothing; — para não trancar usuários já provisionados.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- select permanece aberto a qualquer authenticated; insert/update exigem
-- admin ou editor; delete exige admin. Anônimo continua sem nenhum acesso
-- (RLS default-deny, sem policy para `anon`).
-- ---------------------------------------------------------------------------

alter table public.clients  enable row level security;
alter table public.products enable row level security;
alter table public.sales    enable row level security;

create policy "clients_select" on public.clients for select to authenticated using (true);
create policy "clients_insert" on public.clients for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "clients_update" on public.clients for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "clients_delete" on public.clients for delete to authenticated using (public.current_user_role() = 'admin');

create policy "products_select" on public.products for select to authenticated using (true);
create policy "products_insert" on public.products for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "products_update" on public.products for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "products_delete" on public.products for delete to authenticated using (public.current_user_role() = 'admin');

create policy "sales_select" on public.sales for select to authenticated using (true);
create policy "sales_insert" on public.sales for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "sales_update" on public.sales for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "sales_delete" on public.sales for delete to authenticated using (public.current_user_role() = 'admin');

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
create policy "stock_movements_insert" on public.stock_movements for insert to authenticated with check (public.current_user_role() in ('admin','editor'));
create policy "stock_movements_update" on public.stock_movements for update to authenticated using (public.current_user_role() in ('admin','editor')) with check (public.current_user_role() in ('admin','editor'));
create policy "stock_movements_delete" on public.stock_movements for delete to authenticated using (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Store settings (single-row config — this app has no multi-tenancy, so
-- there is exactly one settings row, enforced by the `id = 'singleton'` check)
-- ---------------------------------------------------------------------------

create table if not exists public.store_settings (
  id             text primary key default 'singleton',
  store_name     text not null default 'ByteFlow Pro',
  store_segment  text not null default 'Informática & Eletrônicos',
  updated_at     timestamptz not null default now(),
  -- limites configuráveis de estoque: <= stock_critical => 'Crítico',
  -- <= stock_low => 'Estoque Baixo' (editáveis em Configurações)
  stock_critical integer not null default 2,
  stock_low      integer not null default 8,
  constraint store_settings_singleton check (id = 'singleton'),
  constraint store_settings_stock_critical_nonneg check (stock_critical >= 0),
  constraint store_settings_thresholds_order check (stock_low >= stock_critical)
);

alter table public.store_settings enable row level security;
create policy "store_settings_select" on public.store_settings for select to authenticated using (true);
create policy "store_settings_update" on public.store_settings for update to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
-- No insert/delete policy for `authenticated`: the singleton row is seeded once below,
-- the app only ever updates it.

insert into public.store_settings (id, store_name, store_segment)
values ('singleton', 'ByteFlow Pro', 'Informática & Eletrônicos')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Funções atômicas de estoque
-- Movimentação com lock de linha (for update): guarda contra estoque negativo,
-- deriva o status pelos thresholds do singleton e insere o movimento — tudo em
-- uma transação. Substitui o read-modify-write no código da aplicação, que era
-- sujeito a corrida entre vendas simultâneas do mesmo produto.
-- ---------------------------------------------------------------------------

create or replace function public.apply_stock_movement(
  p_product_id text,
  p_delta      integer,
  p_type       text,             -- 'venda' | 'estorno' | 'reposição' | 'ajuste' | 'cadastro'
  p_reason     text default null,
  p_set_to     integer default null  -- quando informado, define o nível absoluto (ignora p_delta)
) returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_crit   integer;
  v_low    integer;
  v_old    integer;
  v_new    integer;
  v_name   text;
  v_mov_id text;
begin
  select stock_critical, stock_low into v_crit, v_low
  from store_settings where id = 'singleton';
  v_crit := coalesce(v_crit, 2);
  v_low  := coalesce(v_low, 8);

  select stock_level, name into v_old, v_name
  from products where id = p_product_id
  for update;

  if not found then
    raise exception 'Produto % não encontrado', p_product_id;
  end if;

  v_new := coalesce(p_set_to, v_old + coalesce(p_delta, 0));

  if v_new < 0 then
    raise exception 'Estoque insuficiente: há % unidade(s) de %, não é possível dar saída de %.',
      v_old, v_name, abs(coalesce(p_delta, 0));
  end if;

  update products set
    stock_level = v_new,
    status = case
      when v_new <= v_crit then 'Crítico'
      when v_new <= v_low  then 'Estoque Baixo'
      else 'Em Estoque'
    end
  where id = p_product_id;

  -- id #MOV-XXXXX único gerado no banco (substitui o select-all-ids + makeId no app)
  loop
    v_mov_id := '#MOV-' || (10000 + floor(random() * 90000))::int;
    exit when not exists (select 1 from stock_movements where id = v_mov_id);
  end loop;

  insert into stock_movements (id, product_id, product_name, type, delta, resulting_stock, reason)
  values (v_mov_id, p_product_id, v_name, p_type, v_new - v_old, v_new, p_reason);

  return v_new;
end
$$;

-- Reposição em massa: cada produto com estoque <= stock_low volta ao SEU max_stock.
create or replace function public.replenish_all_low()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_low   integer;
  v_count integer := 0;
  r record;
begin
  select stock_low into v_low from store_settings where id = 'singleton';
  v_low := coalesce(v_low, 8);

  for r in
    select id from products
    where stock_level <= v_low and stock_level < max_stock
    order by id
  loop
    perform apply_stock_movement(r.id, null, 'reposição', 'Reposição automática em massa',
      (select max_stock from products where id = r.id));
    v_count := v_count + 1;
  end loop;

  return v_count;
end
$$;

-- Recalcula o status de todos os produtos pelos thresholds atuais
-- (chamado ao salvar os parâmetros de estoque nas Configurações).
create or replace function public.recalc_product_statuses()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_crit integer;
  v_low  integer;
begin
  select stock_critical, stock_low into v_crit, v_low
  from store_settings where id = 'singleton';
  v_crit := coalesce(v_crit, 2);
  v_low  := coalesce(v_low, 8);

  update products set status = case
    when stock_level <= v_crit then 'Crítico'
    when stock_level <= v_low  then 'Estoque Baixo'
    else 'Em Estoque'
  end
  where status is distinct from case
    when stock_level <= v_crit then 'Crítico'
    when stock_level <= v_low  then 'Estoque Baixo'
    else 'Em Estoque'
  end;
end
$$;

grant execute on function
  public.apply_stock_movement(text, integer, text, text, integer),
  public.replenish_all_low(),
  public.recalc_product_statuses()
to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket público para fotos de produtos (upload direto do browser
-- pelo staff autenticado; leitura pública via getPublicUrl + next/image)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "product_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- Rate limiting — tabela Postgres própria, sem serviço externo (Upstash/etc).
-- Verificada pelas Server Actions de escrita via RPC antes da mutação, chave
-- (ip, action). Sem policy de select/insert para authenticated de propósito —
-- só a RPC (security definer) grava aqui, default-deny intencional.
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  ip         text not null,
  action     text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_ip_action_created_idx
  on public.rate_limit_hits (ip, action, created_at desc);

alter table public.rate_limit_hits enable row level security;

create or replace function public.check_rate_limit(
  p_ip text, p_action text, p_limit int, p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from rate_limit_hits
  where created_at < now() - make_interval(secs => p_window_seconds) * 2;

  select count(*) into v_count from rate_limit_hits
  where ip = p_ip and action = p_action
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if v_count >= p_limit then
    return false;
  end if;

  insert into rate_limit_hits (ip, action) values (p_ip, p_action);
  return true;
end;
$$;

-- Chamada via .rpc() pelas Server Actions autenticadas; anon não deve chamar.
revoke execute on function public.check_rate_limit(text, text, int, int) from anon;
grant execute on function public.check_rate_limit(text, text, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit log — quem (auth.uid()) mudou o quê e quando em clients/products/
-- sales/store_settings, com valores antigo/novo. Não cobre stock_movements
-- (que já é, em si, um log append-only de deltas de estoque). Só admin lê.
-- Funciona porque toda escrita passa pelo client vinculado a cookies
-- (nunca pelo client de service-role usado nas leituras cacheadas), então
-- auth.uid() sempre resolve para o autor real da mudança.
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  table_name text not null,
  row_id     text not null,
  action     text not null check (action in ('insert','update','delete')),
  actor      uuid references auth.users(id),
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_table_row_idx on public.audit_log (table_name, row_id, created_at desc);

alter table public.audit_log enable row level security;
create policy "audit_log_select_admin" on public.audit_log
  for select to authenticated
  using (public.current_user_role() = 'admin');
-- Sem insert/update/delete policy para authenticated: só a trigger
-- (security definer) grava linhas aqui.

create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (table_name, row_id, action, actor, old_data, new_data)
  values (
    tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    lower(tg_op),
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- Trigger function é só para uso interno — nunca deve ser chamável via RPC.
revoke execute on function public.audit_trigger_fn() from anon, authenticated;

create trigger clients_audit        after insert or update or delete on public.clients        for each row execute function public.audit_trigger_fn();
create trigger products_audit       after insert or update or delete on public.products        for each row execute function public.audit_trigger_fn();
create trigger sales_audit          after insert or update or delete on public.sales           for each row execute function public.audit_trigger_fn();
create trigger store_settings_audit after insert or update or delete on public.store_settings  for each row execute function public.audit_trigger_fn();
