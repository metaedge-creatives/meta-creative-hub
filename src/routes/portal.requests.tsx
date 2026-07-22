import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClipboardList, Search, Clock, Eye, FileText, XCircle, CheckCircle2, Circle, Layers,
} from "lucide-react";
import type { ServiceRequestStatus, ServiceRequest } from "@/lib/crm/types";

export const Route = createFileRoute("/portal/requests")({
  head: () => ({ meta: [{ title: "My Requests · Client Portal" }] }),
  component: PortalRequests,
});

const STEPS: { key: ServiceRequestStatus; label: string }[] = [
  { key: "new", label: "Submitted" },
  { key: "reviewing", label: "Reviewing" },
  { key: "quoted", label: "Proposal sent" },
  { key: "converted", label: "Converted" },
];

const STATUS_META: Record<ServiceRequestStatus, { label: string; dot: string; chip: string; icon: React.ComponentType<{ className?: string }> }> = {
  new:        { label: "Submitted",   dot: "bg-blue-500",   chip: "bg-blue-50 text-blue-700 border-blue-200",     icon: Clock },
  reviewing:  { label: "Reviewing",   dot: "bg-amber-500",  chip: "bg-amber-50 text-amber-700 border-amber-200",   icon: Eye },
  quoted:     { label: "Proposal",    dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200", icon: FileText },
  converted:  { label: "Converted",   dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  declined:   { label: "Declined",    dot: "bg-rose-500",   chip: "bg-rose-50 text-rose-700 border-rose-200",       icon: XCircle },
};

const FILTERS: Array<"all" | ServiceRequestStatus> = ["all", "new", "reviewing", "quoted", "converted", "declined"];

function fmt(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusChip({ status }: { status: ServiceRequestStatus }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${m.chip}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function StatusStepper({ req }: { req: ServiceRequest }) {
  const declined = req.status === "declined";
  const currentIdx = STEPS.findIndex((s) => s.key === req.status);
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const reached = !declined && currentIdx >= i;
          const isCurrent = !declined && currentIdx === i;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                    reached
                      ? "border-primary bg-primary text-white"
                      : "border-divider bg-white text-neutral-400"
                  } ${isCurrent ? "ring-4 ring-primary/15" : ""}`}
                >
                  {reached ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                </div>
                <div className={`mt-1 text-[10px] font-black uppercase tracking-wider ${reached ? "text-primary" : "text-neutral-400"}`}>
                  {step.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${!declined && currentIdx > i ? "bg-primary" : "bg-divider"}`} />
              )}
            </div>
          );
        })}
      </div>
      {declined && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
          <XCircle className="h-3.5 w-3.5" /> This request was declined. Feel free to send an updated brief.
        </div>
      )}
    </div>
  );
}

function PortalRequests() {
  const client = useCurrentClientUser();
  const all = useCRM((s) => s.serviceRequests);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ServiceRequestStatus>("all");

  const mine = useMemo(() => {
    if (!client) return [];
    return all
      .filter((r) => r.clientUserId === client.id)
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  }, [client, all]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mine.length };
    for (const r of mine) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [mine]);

  const filtered = useMemo(() => {
    return mine.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !`${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [mine, filter, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">My Requests</div>
            <div className="text-xs" style={{ color: "#777" }}>
              Track every service request you've submitted and its current state.
            </div>
          </div>
        </div>
        <Link to="/portal/services">
          <Button className="font-bold"><Layers className="h-4 w-4" /> Browse services</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your requests" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f;
            const label = f === "all" ? "All" : STATUS_META[f].label;
            const n = counts[f] ?? 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-divider bg-white text-neutral-700 hover:border-primary/40"
                }`}
              >
                {f !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[f as ServiceRequestStatus].dot}`} />}
                {label}
                <span className={`rounded-full px-1.5 py-0 text-[10px] ${active ? "bg-white/20" : "bg-neutral-100 text-neutral-600"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-10 text-center text-sm" style={{ color: "#888" }}>
          <ClipboardList className="mx-auto mb-3 h-6 w-6 text-primary" />
          {mine.length === 0
            ? "You haven't submitted any service requests yet."
            : "No requests match this filter."}
          <div className="mt-3">
            <Link to="/portal/services">
              <Button size="sm" className="font-bold">Start a new request</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-divider bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-black">{r.title}</div>
                    <StatusChip status={r.status} />
                  </div>
                  {r.description && (
                    <p className="mt-1 text-[12px]" style={{ color: "#666" }}>{r.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "#888" }}>
                    <span>Submitted {fmt(r.createdAt)}</span>
                    {r.updatedAt && r.updatedAt !== r.createdAt && <span>Updated {fmt(r.updatedAt)}</span>}
                    {r.budget ? <span>Budget ${Number(r.budget).toLocaleString()}</span> : null}
                  </div>
                </div>
              </div>

              <StatusStepper req={r} />

              {r.history && r.history.length > 1 && (
                <details className="mt-4 rounded-xl bg-neutral-50 p-3">
                  <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-primary">
                    Activity ({r.history.length})
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {[...r.history].reverse().map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px]">
                        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${STATUS_META[h.status].dot}`} />
                        <div className="flex-1">
                          <span className="font-bold">{STATUS_META[h.status].label}</span>
                          {h.note && <span className="text-neutral-600"> — {h.note}</span>}
                        </div>
                        <span className="text-[10px] text-neutral-500">{fmt(h.at)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
