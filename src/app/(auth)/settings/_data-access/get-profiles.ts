import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";

export interface ProfileRow {
  id: string;
  email: string | null;
  role: Role;
}

// A RLS de `profiles` já restringe a listagem completa a quem é admin —
// um usuário não-admin chamando isso só enxerga a própria linha.
export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .order("email");

  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, email: p.email, role: p.role as Role }));
}
