// Server functions for client-users cloud sync.
// The public.client_users_sync table is service-role only; RLS blocks anon/authenticated.
// All reads/writes from the browser go through these functions.
import { createServerFn } from "@tanstack/react-start";

const TABLE = "client_users_sync";

export const cloudPushClientUser = createServerFn({ method: "POST" })
  .validator((input: { id: string; email: string; data: unknown }) => {
    if (!input || typeof input.id !== "string" || typeof input.email !== "string") {
      throw new Error("Invalid input");
    }
    if (!input.id.trim() || !input.email.trim()) throw new Error("Missing id/email");
    if (input.id.length > 128 || input.email.length > 320) throw new Error("Field too long");
    return {
      id: input.id.trim(),
      email: input.email.trim().toLowerCase(),
      data: input.data,
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from(TABLE) as any).upsert(
      { id: data.id, email: data.email, data: data.data },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cloudDeleteClientUser = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (!input || typeof input.id !== "string" || !input.id.trim()) throw new Error("Invalid id");
    if (input.id.length > 128) throw new Error("Id too long");
    return { id: input.id.trim() };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from(TABLE) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cloudFetchClientUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin.from(TABLE) as any)
    .select("data")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { rows: (data ?? []).map((r: { data: unknown }) => r.data) };
});
