import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { createClient as createCookieClient } from "./server";
import type { Database } from "../database.types";

type DB = SupabaseClient<Database>;

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente service-role: não usa cookies (pode rodar dentro de unstable_cache, que não
// permite cookies()) e ignora RLS. Só server-side. Como as políticas RLS deste projeto
// são `to authenticated using (true)`, todo usuário autenticado enxerga os mesmos dados —
// não há dado por-usuário, então um cache global compartilhado é correto. O middleware já
// barra requisições não autenticadas antes de qualquer página cacheada renderizar.
function serviceClient(): DB {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Executa uma leitura no servidor, cacheável e invalidável por `tags` (revalidateTag).
 *
 * Com SUPABASE_SERVICE_ROLE_KEY definida, o resultado é memoizado por `keyParts`
 * (unstable_cache) e reaproveitado entre navegações — elimina o round-trip ao Supabase
 * na maioria dos cliques. As write actions chamam revalidateTag(tag) para invalidar.
 *
 * Sem a key, cai graciosamente para leitura direta via cookie client (sujeita a RLS),
 * sem cache — o app funciona igual, apenas sem o ganho de performance.
 */
export async function cachedRead<T>(
  keyParts: string[],
  tags: string[],
  run: (db: DB) => Promise<T>,
): Promise<T> {
  if (!SERVICE_KEY) {
    const db = (await createCookieClient()) as unknown as DB;
    return run(db);
  }
  return unstable_cache(() => run(serviceClient()), keyParts, { tags })();
}
