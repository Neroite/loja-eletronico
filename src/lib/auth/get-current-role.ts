import { createClient } from "@/lib/supabase/server";
import type { Role } from "./roles";

export interface CurrentUser {
  userId: string;
  role: Role;
}

export async function getCurrentUserRole(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { userId: user.id, role: profile.role as Role };
}
