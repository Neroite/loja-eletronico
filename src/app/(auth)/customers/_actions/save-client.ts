"use server";

import { createClient } from "@/lib/supabase/server";
import { toClientRow } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import { makeId } from "@/lib/id";
import { clientSchema } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { Client } from "@/types";

type SaveClientInput = Omit<Client, "id" | "createdAt"> & { id?: string; createdAt?: string };

export async function saveClient(data: SaveClientInput, isEdit: boolean): Promise<void> {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await requireRole(["admin", "editor"]);
  await enforceRateLimit("save-client");

  const supabase = await createClient();

  let id = data.id;
  if (!isEdit) {
    const { data: existing } = await supabase.from("clients").select("id");
    id = makeId("#CLI-", (existing ?? []).map((c) => c.id), 3);
  }

  const client: Client = {
    ...data,
    id: id!,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };

  const { error } = await supabase.from("clients").upsert(toClientRow(client) as never);
  if (error) throw error;

  revalidateTag("clients");
  revalidatePath("/customers");
}
