// Shared-device sync for client users via Lovable Cloud.
// Mirrors the localStorage `clientUsers` array to public.client_users_sync
// through service-role-backed server functions (browser has no direct DB access).
//
// A single flag `mec.cloudSync` in localStorage (default ON) gates all writes.

import type { ClientUser } from "./types";
import {
  cloudPushClientUser,
  cloudDeleteClientUser,
  cloudFetchClientUsers,
} from "./cloudSync.functions";

const FLAG_KEY = "mec.cloudSync";

export function isCloudSyncEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const v = window.localStorage.getItem(FLAG_KEY);
  return v === null ? true : v === "1";
}

export function setCloudSyncEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FLAG_KEY, enabled ? "1" : "0");
}

function log(err: unknown, ctx: string) {
  // eslint-disable-next-line no-console
  console.warn(`[cloudSync:${ctx}]`, err);
}

export async function pushClientUser(user: ClientUser): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    await cloudPushClientUser({
      data: {
        id: user.id,
        email: user.email.trim().toLowerCase(),
        data: user,
      },
    });
  } catch (e) {
    log(e, "push");
  }
}

export async function deleteClientUserRemote(id: string): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    await cloudDeleteClientUser({ data: { id } });
  } catch (e) {
    log(e, "delete");
  }
}

export async function fetchAllClientUsers(): Promise<ClientUser[] | null> {
  if (!isCloudSyncEnabled()) return null;
  try {
    const res = await cloudFetchClientUsers();
    return (res.rows ?? [])
      .filter((u: unknown): u is ClientUser => {
        const c = u as ClientUser | null | undefined;
        return !!c && typeof c.id === "string" && typeof c.email === "string";
      });
  } catch (e) {
    log(e, "fetch");
    return null;
  }
}

/** Merge remote list into local, preferring the newer record per id/email. */
export function mergeClientUsers(local: ClientUser[], remote: ClientUser[]): ClientUser[] {
  const byKey = new Map<string, ClientUser>();
  const keyOf = (u: ClientUser) => u.id || u.email.trim().toLowerCase();
  for (const u of local) byKey.set(keyOf(u), u);
  for (const r of remote) {
    const k = keyOf(r);
    const existing = byKey.get(k);
    if (!existing) {
      byKey.set(k, r);
      continue;
    }
    const localTime = Date.parse(existing.lastInvitedAt || existing.createdAt || "") || 0;
    const remoteTime = Date.parse(r.lastInvitedAt || r.createdAt || "") || 0;
    byKey.set(k, remoteTime >= localTime ? r : existing);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"),
  );
}
