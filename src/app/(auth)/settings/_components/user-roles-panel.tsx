"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { updateUserRole } from "../_actions/update-user-role";
import type { ProfileRow } from "../_data-access/get-profiles";
import type { Role } from "@/lib/auth/roles";

interface UserRolesPanelProps {
  profiles: ProfileRow[];
  currentUserId: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  user: "Somente leitura",
};

export default function UserRolesPanel({ profiles, currentUserId }: UserRolesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (userId: string, role: Role) => {
    startTransition(async () => {
      try {
        await updateUserRole({ userId, role });
        toast.success("Papel do usuário atualizado.");
        router.refresh();
      } catch {
        toast.error("Erro ao atualizar o papel do usuário.");
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-brand" />
        <h3 className="font-display text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Usuários & Papéis
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {profiles.map((profile) => (
          <div key={profile.id} className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {profile.email ?? profile.id}
              </p>
              {profile.id === currentUserId && (
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Você</p>
              )}
            </div>
            <select
              value={profile.role}
              disabled={isPending || profile.id === currentUserId}
              onChange={(e) => handleChange(profile.id, e.target.value as Role)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand transition-colors disabled:opacity-60"
            >
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
