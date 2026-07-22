import { useCRM } from "./store";
import type { Module, ClientPortalPermissions, ClientUser } from "./types";

/**
 * Role-based ownership check for client-portal data.
 * Prefers the explicit `clientUserId` link; falls back to email, then to
 * name/company matching for legacy rows created before ownership existed.
 */
export function isOwnedByClient(
  entity: {
    clientUserId?: string | null;
    clientEmail?: string | null;
    clientName?: string | null;
  } | null | undefined,
  client: ClientUser | null | undefined,
): boolean {
  if (!entity || !client) return false;
  if (entity.clientUserId) return entity.clientUserId === client.id;
  const email = entity.clientEmail?.trim().toLowerCase();
  if (email && client.email.trim().toLowerCase() === email) return true;
  const name = entity.clientName?.trim().toLowerCase();
  if (!name) return false;
  if (name === client.name.trim().toLowerCase()) return true;
  const company = (client.companyName || "").trim().toLowerCase();
  return !!company && name === company;
}

export function useCurrentUser() {
  return useCRM((s) => {
    if (!s.currentUserId) return null;
    return s.users.find((u) => u.id === s.currentUserId) ?? null;
  });
}

export function useCurrentClientUser() {
  return useCRM((s) => {
    if (!s.currentClientUserId) return null;
    return s.clientUsers.find((c) => c.id === s.currentClientUserId) ?? null;
  });
}

export function useCan(module: Module) {
  const user = useCurrentUser();
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return !!user.permissions[module];
}

export function useClientCan(key: keyof ClientPortalPermissions) {
  const client = useCurrentClientUser();
  if (!client) return false;
  const perms = client.permissions ?? {};
  // default-allow for keys not explicitly set
  return perms[key] !== false;
}

export function usePaymentsModuleEnabled() {
  return useCRM((s) => Boolean(s.moduleSettings?.modules?.payments));
}

export function useStripeConnected() {
  return useCRM((s) => Boolean(s.moduleSettings?.modules?.stripeConnected));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}