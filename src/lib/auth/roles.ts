export type Role = "admin" | "editor" | "user";

export function canWrite(role: Role): boolean {
  return role === "admin" || role === "editor";
}

export function canDelete(role: Role): boolean {
  return role === "admin";
}

export function canManageSettings(role: Role): boolean {
  return role === "admin";
}
