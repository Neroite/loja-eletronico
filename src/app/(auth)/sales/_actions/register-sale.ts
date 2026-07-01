"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { makeId } from "@/lib/id";
import { deriveStatus } from "@/lib/stock";
import type { PaymentMethod, SaleStatus, SaleItem } from "@/types";

interface RegisterSaleInput {
  clientId?: string;
  clientName: string;
  clientDoc: string;
  seller: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  items: SaleItem[];
}

export async function registerSale(input: RegisterSaleInput): Promise<void> {
  const supabase = await createClient();

  const { data: existingSales } = await supabase.from("sales").select("id");
  const saleId = makeId("#BF-", (existingSales ?? []).map((s) => s.id), 5);

  const now = new Date().toISOString();
  const totalValue = input.items.reduce((acc, i) => acc + i.quantity * i.price, 0);

  const { error: saleError } = await supabase.from("sales").insert({
    id: saleId,
    created_at: now,
    client_id: input.clientId ?? null,
    client_name: input.clientName,
    client_doc: input.clientDoc,
    seller: input.seller,
    payment_method: input.paymentMethod,
    total_value: totalValue,
    status: input.status,
    items: input.items,
  });

  if (saleError) throw saleError;

  const { data: existingMovements } = await supabase.from("stock_movements").select("id");
  const movIds = (existingMovements ?? []).map((m) => m.id);

  for (const item of input.items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_level, name")
      .eq("id", item.productId)
      .single();

    if (!product) continue;

    const newStock = product.stock_level - item.quantity;
    await supabase
      .from("products")
      .update({ stock_level: newStock, status: deriveStatus(newStock) })
      .eq("id", item.productId);

    const movId = makeId("#MOV-", movIds, 5);
    movIds.push(movId);

    await supabase.from("stock_movements").insert({
      id: movId,
      product_id: item.productId,
      product_name: item.name,
      type: "venda",
      delta: -item.quantity,
      resulting_stock: newStock,
      reason: `Venda ${saleId}`,
      created_at: now,
    });
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
