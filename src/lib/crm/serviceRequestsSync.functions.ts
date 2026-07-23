// Server functions to sync service requests across devices.
// Table `service_requests_sync` is service-role-only; all access via these functions.
import { createServerFn } from "@tanstack/react-start";

const TABLE = "service_requests_sync";

export const cloudPushServiceRequest = createServerFn({ method: "POST" })
  .validator((input: { id: string; clientEmail?: string; data: unknown }) => {
    if (!input || typeof input.id !== "string" || !input.id.trim()) {
      throw new Error("Invalid id");
    }
    if (input.id.length > 128) throw new Error("Id too long");
    const email =
      typeof input.clientEmail === "string" && input.clientEmail.trim()
        ? input.clientEmail.trim().toLowerCase().slice(0, 320)
        : null;
    return { id: input.id.trim(), clientEmail: email, data: input.data };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from(TABLE) as any).upsert(
      {
        id: data.id,
        client_email: data.clientEmail,
        data: data.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cloudDeleteServiceRequest = createServerFn({ method: "POST" })
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

export const cloudFetchServiceRequests = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin.from(TABLE) as any)
      .select("data")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []).map((r: { data: unknown }) => r.data) };
  },
);
