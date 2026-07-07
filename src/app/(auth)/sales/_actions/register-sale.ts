"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { makeId } from "@/lib/id";
import { registerSaleInputSchema } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";
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
  const parsed = registerSaleInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await requireRole(["admin", "editor"]);
  await enforceRateLimit("register-sale");

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

  // Baixa de estoque via RPC atômica (lock de linha + guarda de estoque negativo +
  // insert do movimento na mesma transação). Cart items are unique per productId
  // (NewSaleModal merges quantities), so each item touches a different product
  // row — safe to process concurrently.
  const results = await Promise.all(
    input.items.map((item) =>
      supabase.rpc("apply_stock_movement", {
        p_product_id: item.productId,
        p_delta: -item.quantity,
        p_type: "venda",
        p_reason: `Venda ${saleId}`,
      })
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidateTag("sales");
  revalidateTag("products");
  revalidateTag("stock_movements");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}
