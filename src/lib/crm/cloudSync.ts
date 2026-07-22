// Shared-device sync for client users via Lovable Cloud.
// Mirrors the localStorage `clientUsers` array to public.client_users_sync
// so a client who signs up on one device shows up in every admin browser.
//
// A single flag `mec.cloudSync` in localStorage (default ON) gates all writes.
// Disabling it stops both reads and writes — the app falls back to pure
// localStorage behaviour.

import { supabase } from "@/integrations/supabase/client";
import type { ClientUser } from "./types";

const FLAG_KEY = "mec.cloudSync";
const TABLE = "client_users_sync";

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
  // Non-fatal — sync is best-effort so the local UX never blocks.
  // eslint-disable-next-line no-console
  console.warn(`[cloudSync:${ctx}]`, err);
}

export async function pushClientUser(user: ClientUser): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await (supabase.from(TABLE) as any).upsert(
      {
        id: user.id,
        email: user.email.trim().toLowerCase(),
        data: user,
      },
      { onConflict: "id" },
    );
    if (error) log(error, "push");
  } catch (e) {
    log(e, "push");
  }
}

export async function deleteClientUserRemote(id: string): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    const { error } = await (supabase.from(TABLE) as any).delete().eq("id", id);
    if (error) log(error, "delete");
  } catch (e) {
    log(e, "delete");
  }
}

export async function fetchAllClientUsers(): Promise<ClientUser[] | null> {
  if (!isCloudSyncEnabled()) return null;
  try {
    const { data, error } = await (supabase.from(TABLE) as any)
      .select("data")
      .order("created_at", { ascending: false });
    if (error) {
      log(error, "fetch");
      return null;
    }
    return (data ?? [])
      .map((r: { data: ClientUser }) => r.data)
      .filter((u: ClientUser | null | undefined): u is ClientUser => !!u && !!u.id && !!u.email);
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
    // Prefer whichever record was updated more recently.
    const localTime = Date.parse(existing.lastInvitedAt || existing.createdAt || "") || 0;
    const remoteTime = Date.parse(r.lastInvitedAt || r.createdAt || "") || 0;
    byKey.set(k, remoteTime >= localTime ? r : existing);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"),
  );
}
