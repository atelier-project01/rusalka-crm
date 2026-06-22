// CRM staff roles and per-module access. The role is carried on the staff
// user's app_metadata.crm_role (set in the RusalkaOps auth project), so it
// travels in the session/JWT — no extra query. Default is least-privilege.

// Marketing Campaigns is deferred out of v1 (handled by a separate plan).
export const MODULE_KEYS = [
  "dashboard",
  "customers",
  "fulfillment",
  "barcode",
  "care",
  "knowledge",
  "audit",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const ROLES = ["admin", "operations", "barcode", "care", "viewer"] as const;
export type Role = (typeof ROLES)[number];

// Which modules each role may open. Everyone gets the dashboard.
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  admin: ["dashboard", "customers", "fulfillment", "barcode", "care", "knowledge", "audit"],
  operations: ["dashboard", "fulfillment", "customers", "knowledge"],
  barcode: ["dashboard", "barcode", "knowledge"],
  care: ["dashboard", "customers", "care", "knowledge"],
  viewer: ["dashboard", "customers", "knowledge"],
};

type UserLike = { app_metadata?: Record<string, unknown> | null } | null | undefined;

export function roleFromUser(user: UserLike): Role {
  const r = user?.app_metadata?.crm_role;
  return typeof r === "string" && (ROLES as readonly string[]).includes(r) ? (r as Role) : "viewer";
}

export function allowedModules(role: Role): ModuleKey[] {
  return ROLE_MODULES[role];
}

export function canAccess(role: Role, module: ModuleKey): boolean {
  return ROLE_MODULES[role].includes(module);
}

/** Map a pathname to a module key, or null for non-module routes (/login, etc.). */
export function moduleFromPath(pathname: string): ModuleKey | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (MODULE_KEYS as readonly string[]).includes(seg) ? (seg as ModuleKey) : null;
}
