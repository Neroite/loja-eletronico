# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ByteFlow Pro** — an inventory & sales app for an electronics store, built with React 19 + TypeScript + Vite + Tailwind v4. The UI is in Brazilian Portuguese. Data lives in React state and is mirrored to `localStorage` via the `usePersistentState` hook (`src/lib/usePersistentState.ts`) — that hook is the single persistence seam, intended to be swapped for a Supabase data layer later without touching the `App.tsx` mutation handlers. It is intentionally non-fiscal: there is no NFC-e / tax / invoicing — just selling products, tracking stock to replenish, and a client registry linked to sales.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build (Vite)
npm run lint      # Type-check with tsc --noEmit (no ESLint configured)
npm run preview   # Preview production build
```

There is no test suite. `lint` runs `tsc --noEmit` only — use it as the primary correctness gate.

## Architecture

**State and business logic live entirely in `src/App.tsx`.** It holds the three datasets (`products`, `sales`, `clients`) plus store config, and owns every mutation handler (register sale, refund, save/delete product, bulk replenish, recalc stock, save/delete client). View components are presentational: they receive data + callbacks via props and keep only UI-local state (filters, pagination, selection).

**Data flow:** `App.tsx` → views/modals via props → user action calls a handler in `App.tsx` → `setState` with functional updates → re-render.

**Shared logic lives in `src/lib/` — reuse it, do not re-inline:**
- `lib/stock.ts` — **single source of truth** for stock rules. `STOCK = { critical: 2, low: 8 }`, `deriveStatus(stockLevel)`, `isLow`, `isCritical`, `needsReplenish`. Any place that derives a product status or counts low/critical items must use these.
- `lib/format.ts` — `formatBRL()` (the one currency formatter).
- `lib/date.ts` — sales carry an ISO `createdAt`; display strings (`formatDateBR`, `formatTime`) and period filters (`inPeriod`, `inMonthYear`, `previousPeriodMatcher`, `Period`) are all derived from it. No hardcoded dates.
- `lib/csv.ts` — `downloadCSV()` for real CSV export (Sales + Inventory).
- `components/StatusBadge.tsx` (sale status) and `components/StockBadge.tsx` (product status + `progressBarColor`) — shared badges; don't re-create the color ternaries.

**Views (tabs, driven by `activeTab` in `App.tsx`):** `DashboardView`, `SalesView`, `InventoryView`, `ClientsView`, plus an inline Settings panel in `App.tsx` (store name/segment + stock-parameter reference).
**Modals:** `NewSaleModal`, `ProductModal`, `SaleDetailsModal`, `ClientModal` — toggled by boolean/selection state in `App.tsx`.

**Key data-model notes (`src/types.ts`):**
- `Sale.createdAt` (ISO) is the source of truth for date/time and all period filtering.
- `Sale.clientId?` links a sale to a registered `Client`; `clientName`/`clientDoc` are snapshots (walk-in "Consumidor Final" sales have no `clientId`).

**Behavior contracts to preserve:**
- Status thresholds: `Crítico` ≤ 2, `Estoque Baixo` ≤ 8, else `Em Estoque` (via `deriveStatus`).
- Bulk replenish restores each low item to **its own `maxStock`** (not a flat number).
- Header search is wired on Sales/Inventory/Clients and hidden on Dashboard (which has its own period-filter bar + client search). Notifications badge = count of items needing replenishment.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`. Theme tokens live in `src/index.css` under `@theme`: brand palette is **deep navy blue** exposed as `brand`, `brand-dark`, `brand-mid`, `brand-tint`, `brand-ink` (use `bg-brand`, `text-brand-dark`, etc. — do not hardcode hex). The `fadeIn`/`slideIn` keyframes used by modals/toasts are also defined there. Stick to the default Tailwind numeric scale (e.g. `slate-200`, `py-4`) — arbitrary shades like `slate-150` or spacing like `py-4.5` silently produce no style.

## Dependencies

Runtime: `react`, `react-dom`, `lucide-react`, `@supabase/supabase-js`. Build: `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `typescript`, `@types/node`.

**Supabase backend (scaffolded, not yet wired):** the client lives in `src/lib/supabase.ts` (configured from `.env` — see `.env.example` and env typing in `src/vite-env.d.ts`), schema types in `src/lib/database.types.ts`, and the SQL DDL in `supabase/schema.sql`. Nothing imports the client yet — the app still runs entirely on `localStorage` via `usePersistentState`. To connect: fill `.env`, run `supabase/schema.sql`, then swap `usePersistentState` (or the mutation handlers in `App.tsx`) to call Supabase, mapping rows↔models with the `from*Row`/`to*Row` helpers in `src/lib/supabase.ts`.
