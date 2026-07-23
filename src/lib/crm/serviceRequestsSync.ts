// Shared-device sync for service requests via Lovable Cloud.
// Mirrors the local zustand `serviceRequests` list to public.service_requests_sync
// through service-role-backed server functions.
//
// Reuses the same `mec.cloudSync` flag as client-users sync.

import type { ServiceRequest } from "./types";
import {
  cloudPushServiceRequest,
  cloudDeleteServiceRequest,
  cloudFetchServiceRequests,
} from "./serviceRequestsSync.functions";
import { isCloudSyncEnabled } from "./cloudSync";

function log(err: unknown, ctx: string) {
  // eslint-disable-next-line no-console
  console.warn(`[serviceRequestsSync:${ctx}]`, err);
}

export async function pushServiceRequest(req: ServiceRequest): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    await cloudPushServiceRequest({
      data: {
        id: req.id,
        clientEmail: req.clientEmail,
        data: req,
      },
    });
  } catch (e) {
    log(e, "push");
  }
}

export async function deleteServiceRequestRemote(id: string): Promise<void> {
  if (!isCloudSyncEnabled()) return;
  try {
    await cloudDeleteServiceRequest({ data: { id } });
  } catch (e) {
    log(e, "delete");
  }
}

export async function fetchAllServiceRequests(): Promise<ServiceRequest[] | null> {
  if (!isCloudSyncEnabled()) return null;
  try {
    const res = await cloudFetchServiceRequests();
    return (res.rows ?? []).filter((r: unknown): r is ServiceRequest => {
      const s = r as ServiceRequest | null | undefined;
      return !!s && typeof s.id === "string" && typeof s.title === "string";
    });
  } catch (e) {
    log(e, "fetch");
    return null;
  }
}

/** Merge remote list into local, preferring the newer record per id. */
export function mergeServiceRequests(
  local: ServiceRequest[],
  remote: ServiceRequest[],
): ServiceRequest[] {
  const byId = new Map<string, ServiceRequest>();
  const timeOf = (r: ServiceRequest) =>
    Date.parse(r.updatedAt || r.createdAt || "") || 0;
  for (const r of local) byId.set(r.id, r);
  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      continue;
    }
    byId.set(r.id, timeOf(r) >= timeOf(existing) ? r : existing);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (Date.parse(b.updatedAt || b.createdAt || "0") || 0) - (Date.parse(a.updatedAt || a.createdAt || "0") || 0),
  );
}
