import { getCurrentUserRole } from "./get-current-role";
import type { Role } from "./roles";

export class ForbiddenError extends Error {}

export async function requireRole(allowed: Role[]): Promise<void> {
  const current = await getCurrentUserRole();

  if (!current || !allowed.includes(current.role)) {
    throw new ForbiddenError("Você não tem permissão para executar esta ação.");
  }
}
