import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export class RateLimitError extends Error {}

/**
 * Throttling por IP+ação via a RPC `check_rate_limit` (tabela Postgres, sem
 * serviço externo). Fail-open em erro de infra: rate limit é defesa extra,
 * não a autorização primária (RLS + requireRole já cobrem isso) — uma falha
 * transitória do RPC não deve derrubar uma escrita legítima.
 */
export async function enforceRateLimit(
  action: string,
  limit = 20,
  windowSeconds = 60,
): Promise<void> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const supabase = await createClient();
  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_ip: ip,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) return;

  if (!allowed) {
    throw new RateLimitError("Muitas tentativas. Tente novamente em instantes.");
  }
}
