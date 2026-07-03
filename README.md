# ByteFlow Pro

Sistema de **inventário e vendas** para loja de eletrônicos. Dashboard com filtros de período, gestão de estoque com reposição automática e carteira de clientes vinculada às vendas. Interface 100% em português.

Construído com **Next.js 15 (App Router) + TypeScript + Tailwind v4**, com **Supabase** como backend (Postgres + Auth + SSR) — não é mais um app front-end puro com estado em memória.

## Rodar localmente

**Pré-requisitos:** Node.js e um projeto no [Supabase](https://supabase.com).

1. Instalar dependências:
   `npm install`
2. Configurar as variáveis de ambiente:
   - Copiar `.env.example` para `.env.local`
   - Preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os dados do projeto (Settings → API no painel do Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` é opcional — habilita cache de leitura no servidor; sem ela o app funciona igual, só sem esse ganho de performance
3. Rodar o schema do banco: aplicar `supabase/schema.sql` no projeto Supabase (via SQL Editor ou `supabase db push`)
4. Criar um usuário de acesso no painel do Supabase (Authentication → Users) — o login da aplicação usa Supabase Auth, não há cadastro público
5. Rodar a aplicação:
   `npm run dev`
6. Abrir `http://localhost:3000` e entrar com o usuário criado no passo 4

## Scripts

- `npm run dev` — servidor de desenvolvimento (Next.js + Turbopack)
- `npm run build` — build de produção
- `npm run start` — servidor de produção (após `build`)
- `npm run lint` — checagem de tipos (`tsc --noEmit`)
