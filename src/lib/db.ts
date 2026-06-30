import {
  supabase,
  fromProductRow, toProductRow,
  fromClientRow,  toClientRow,
  fromSaleRow,    toSaleRow,
  fromMovementRow, toMovementRow,
} from "./supabase";
import type { Product, Client, Sale, StockMovement } from "../types";
import { INITIAL_PRODUCTS, INITIAL_SALES, INITIAL_CLIENTS } from "../initialData";

// ---------------------------------------------------------------------------
// Initial load — fetch all tables in parallel on session start.
// ---------------------------------------------------------------------------

export async function fetchAllData() {
  const [p, c, s, m] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("sales").select("*").order("created_at", { ascending: false }),
    supabase.from("stock_movements").select("*").order("created_at", { ascending: false }),
  ]);
  if (p.error) throw p.error;
  if (c.error) throw c.error;
  if (s.error) throw s.error;
  if (m.error) throw m.error;
  return {
    products:  p.data.map(fromProductRow),
    clients:   c.data.map(fromClientRow),
    sales:     s.data.map(fromSaleRow),
    movements: m.data.map(fromMovementRow),
  };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function upsertProduct(p: Product): Promise<void> {
  const { error } = await supabase.from("products").upsert(toProductRow(p) as never);
  if (error) throw error;
}

export async function upsertManyProducts(ps: Product[]): Promise<void> {
  if (ps.length === 0) return;
  const { error } = await supabase.from("products").upsert(ps.map((p) => toProductRow(p) as never));
  if (error) throw error;
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function upsertClient(c: Client): Promise<void> {
  const { error } = await supabase.from("clients").upsert(toClientRow(c) as never);
  if (error) throw error;
}

export async function removeClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export async function insertSale(s: Sale): Promise<void> {
  const { error } = await supabase.from("sales").insert(toSaleRow(s) as never);
  if (error) throw error;
}

export async function cancelSale(id: string): Promise<void> {
  const { error } = await supabase.from("sales").update({ status: "Cancelado" }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------

export async function insertMovements(ms: StockMovement[]): Promise<void> {
  if (ms.length === 0) return;
  const { error } = await supabase.from("stock_movements").insert(ms.map((m) => toMovementRow(m) as never));
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Demo data reset — clears all tables and re-seeds with initial data.
// Delete order respects FK constraints (sales → products cascade movements → clients).
// ---------------------------------------------------------------------------

export async function resetAllData(): Promise<void> {
  await supabase.from("sales").delete().not("id", "is", null);
  await supabase.from("products").delete().not("id", "is", null); // cascades stock_movements
  await supabase.from("clients").delete().not("id", "is", null);
  await supabase.from("clients").insert(INITIAL_CLIENTS.map((c) => toClientRow(c) as never));
  await supabase.from("products").insert(INITIAL_PRODUCTS.map((p) => toProductRow(p) as never));
  await supabase.from("sales").insert(INITIAL_SALES.map((s) => toSaleRow(s) as never));
}
