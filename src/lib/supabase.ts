import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Product, Client, Sale, StockMovement } from '../types';

// Supabase client — configured from .env (see .env.example).
// NOTE: nothing imports this yet; the app still runs entirely on localStorage via
// usePersistentState. This is the scaffolding for when you connect the backend.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Helps catch a missing/incomplete .env during development.
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes. ' +
      'Copie .env.example para .env e preencha os valores do seu projeto.'
  );
}

export const supabase = createClient<Database>(url, anonKey);

// ---------------------------------------------------------------------------
// Row ↔ model mappers
//
// The DB uses snake_case columns; the app uses camelCase domain types. Convert at
// this boundary so the rest of the app keeps using Product / Sale / Client unchanged.
// ---------------------------------------------------------------------------

type ProductRow = Database['public']['Tables']['products']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];
type SaleRow = Database['public']['Tables']['sales']['Row'];

export const fromProductRow = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  category: r.category,
  stockLevel: r.stock_level,
  maxStock: r.max_stock,
  status: r.status as Product['status'],
  costPrice: r.cost_price,
  salePrice: r.sale_price,
  imageUrl: r.image_url
});

export const toProductRow = (p: Product): ProductRow => ({
  id: p.id,
  name: p.name,
  category: p.category,
  stock_level: p.stockLevel,
  max_stock: p.maxStock,
  status: p.status,
  cost_price: p.costPrice,
  sale_price: p.salePrice,
  image_url: p.imageUrl
});

export const fromClientRow = (r: ClientRow): Client => ({
  id: r.id,
  name: r.name,
  contactName: r.contact_name ?? undefined,
  doc: r.doc ?? undefined,
  email: r.email ?? undefined,
  phone: r.phone ?? undefined,
  createdAt: r.created_at
});

export const toClientRow = (c: Client): ClientRow => ({
  id: c.id,
  name: c.name,
  contact_name: c.contactName ?? null,
  doc: c.doc ?? null,
  email: c.email ?? null,
  phone: c.phone ?? null,
  created_at: c.createdAt
});

export const fromSaleRow = (r: SaleRow): Sale => ({
  id: r.id,
  createdAt: r.created_at,
  clientId: r.client_id ?? undefined,
  clientName: r.client_name,
  clientDoc: r.client_doc,
  seller: r.seller,
  paymentMethod: r.payment_method as Sale['paymentMethod'],
  totalValue: r.total_value,
  status: r.status as Sale['status'],
  items: r.items
});

export const toSaleRow = (s: Sale): SaleRow => ({
  id: s.id,
  created_at: s.createdAt,
  client_id: s.clientId ?? null,
  client_name: s.clientName,
  client_doc: s.clientDoc,
  seller: s.seller,
  payment_method: s.paymentMethod,
  total_value: s.totalValue,
  status: s.status,
  items: s.items
});

type MovementRow = Database['public']['Tables']['stock_movements']['Row'];

export const fromMovementRow = (r: MovementRow): StockMovement => ({
  id: r.id,
  productId: r.product_id,
  productName: r.product_name,
  type: r.type as StockMovement['type'],
  delta: r.delta,
  resultingStock: r.resulting_stock,
  reason: r.reason ?? undefined,
  createdAt: r.created_at,
});

export const toMovementRow = (m: StockMovement): MovementRow => ({
  id: m.id,
  product_id: m.productId,
  product_name: m.productName,
  type: m.type,
  delta: m.delta,
  resulting_stock: m.resultingStock,
  reason: m.reason ?? null,
  created_at: m.createdAt,
});
