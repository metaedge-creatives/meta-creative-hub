import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCRM } from "@/lib/crm/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Inbox, Search, Mail, User, Clock, Eye, FileText, XCircle, CheckCircle2, Trash2, ArrowRight,
} from "lucide-react";
import type { ServiceRequest, ServiceRequestStatus } from "@/lib/crm/types";

export const Route = createFileRoute("/service-requests")({
  head: () => ({
    meta: [
      { title: "Service Requests · MetaEdge Creatives" },
      { name: "description", content: "Inbox for every client service request — triage, update status, and reply." },
    ],
  }),
  component: ServiceRequestsInbox,
});

const STATUS_META: Record<ServiceRequestStatus, { label: string; dot: string; chip: string; icon: React.ComponentType<{ className?: string }> }> = {
  new:        { label: "New",        dot: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 border-blue-200",       icon: Clock },
  reviewing:  { label: "Reviewing",  dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200",     icon: Eye },
  quoted:     { label: "Quoted",     dot: "bg-violet-500",  chip: "bg-violet-50 text-violet-700 border-violet-200",   icon: FileText },
  converted:  { label: "Converted",  dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  declined:   { label: "Declined",   dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200",         icon: XCircle },
};

const STATUS_ORDER: ServiceRequestStatus[] = ["new", "reviewing", "quoted", "converted", "declined"];

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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

function ServiceRequestsInbox() {
  const all = useCRM((s) => s.serviceRequests);
  const setServiceRequestStatus = useCRM((s) => s.setServiceRequestStatus);
  const updateServiceRequest = useCRM((s) => s.updateServiceRequest);
  const deleteServiceRequest = useCRM((s) => s.deleteServiceRequest);
  const products = useCRM((s) => s.getList("products"));

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ServiceRequestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const sorted = useMemo(
    () => [...all].sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)),
    [all],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sorted.length };
    for (const r of sorted) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [sorted]);

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q) {
        const hay = `${r.title} ${r.description} ${r.clientName} ${r.clientEmail ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [sorted, filter, q]);

  const selected: ServiceRequest | undefined = useMemo(
    () => filtered.find((r) => r.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  );

  const productName = (id?: string) => (id ? products.find((p) => p.id === id)?.name : undefined);

  const changeStatus = (id: string, status: ServiceRequestStatus) => {
    setServiceRequestStatus(id, status);
    toast.success(`Marked as ${STATUS_META[status].label}`);
  };

  const saveNote = () => {
    if (!selected || !note.trim()) return;
    const history = [
      ...(selected.history ?? []),
      { at: new Date().toISOString(), status: selected.status, note: note.trim() },
    ];
    updateServiceRequest(selected.id, { history });
    setNote("");
    toast.success("Note added");
  };

  const remove = (id: string) => {
    if (!confirm("Delete this request permanently?")) return;
    deleteServiceRequest(id);
    setSelectedId(null);
    toast.success("Request deleted");
  };

  const mailto = (r: ServiceRequest) => {
    if (!r.clientEmail) return;
    const subject = encodeURIComponent(`Re: ${r.title}`);
    const body = encodeURIComponent(`Hi ${r.clientName},\n\nThanks for your request — `);
    window.location.href = `mailto:${r.clientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">Service Requests</div>
            <div className="text-xs" style={{ color: "#777" }}>
              Every service request from the client portal — triage, update status, and reply.
            </div>
          </div>
        </div>
        <div className="text-xs font-bold text-muted-foreground">
          {counts.all ?? 0} total · {counts.new ?? 0} new
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, client, or email" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUS_ORDER] as const).map((f) => {
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
                {f !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[f].dot}`} />}
                {label}
                <span className={`rounded-full px-1.5 py-0 text-[10px] ${active ? "bg-white/20" : "bg-neutral-100 text-neutral-600"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-12 text-center text-sm" style={{ color: "#888" }}>
          <Inbox className="mx-auto mb-3 h-6 w-6 text-primary" />
          {sorted.length === 0 ? "No service requests yet." : "No requests match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* List */}
          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {filtered.map((r) => {
              const isActive = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-primary bg-white shadow-md"
                      : "border-divider bg-white hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black">{r.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px]" style={{ color: "#888" }}>
                        <User className="h-3 w-3" />
                        <span className="truncate">{r.clientName}</span>
                      </div>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                  <div className="mt-2 line-clamp-2 text-[12px]" style={{ color: "#666" }}>
                    {r.description || "No description"}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider" style={{ color: "#999" }}>
                    <span>{fmt(r.updatedAt ?? r.createdAt)}</span>
                    {r.budget ? <span>${Number(r.budget).toLocaleString()}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected && (
            <div className="rounded-2xl border border-divider bg-white p-5 lg:max-h-[70vh] lg:overflow-y-auto">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-black">{selected.title}</div>
                    <StatusChip status={selected.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "#888" }}>
                    <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {selected.clientName}</span>
                    {selected.clientEmail && (
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {selected.clientEmail}</span>
                    )}
                    <span>Submitted {fmt(selected.createdAt)}</span>
                    {selected.updatedAt && selected.updatedAt !== selected.createdAt && (
                      <span>Updated {fmt(selected.updatedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.clientEmail && (
                    <Button size="sm" variant="outline" onClick={() => mailto(selected)}>
                      <Mail className="h-3.5 w-3.5" /> Reply
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => remove(selected.id)} className="text-rose-600 hover:text-rose-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Service</div>
                  <div className="mt-0.5 text-sm font-bold">{productName(selected.productId) ?? "Custom brief"}</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Budget</div>
                  <div className="mt-0.5 text-sm font-bold">
                    {selected.budget ? `$${Number(selected.budget).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => changeStatus(selected.id, v as ServiceRequestStatus)}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">Brief</div>
                <div className="whitespace-pre-wrap rounded-xl border border-divider bg-white p-3 text-sm" style={{ color: "#444" }}>
                  {selected.description || "—"}
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">Quick actions</div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.filter((s) => s !== selected.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus(selected.id, s)}
                      className="text-xs font-bold"
                    >
                      <ArrowRight className="h-3 w-3" /> {STATUS_META[s].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">Add internal note</div>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Log an update on this request (visible in activity)…"
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" onClick={saveNote} disabled={!note.trim()}>Add note</Button>
                </div>
              </div>

              {selected.history && selected.history.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    Activity ({selected.history.length})
                  </div>
                  <ul className="space-y-1.5">
                    {[...selected.history].reverse().map((h, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg bg-neutral-50 p-2 text-[12px]">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[h.status].dot}`} />
                        <div className="flex-1">
                          <span className="font-bold">{STATUS_META[h.status].label}</span>
                          {h.note && <span className="text-neutral-600"> — {h.note}</span>}
                        </div>
                        <span className="shrink-0 text-[10px] text-neutral-500">{fmt(h.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
