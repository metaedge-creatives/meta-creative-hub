import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate, formatCurrency } from "@/lib/crm/hooks";
import type { Contract, ContractStatus } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2, Edit, ScrollText, Search, Filter, Upload, Download,
  FileSignature, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

const STATUSES: { id: ContractStatus; label: string }[] = [
  { id: "draft", label: "Draft" }, { id: "sent", label: "Sent" }, { id: "signed", label: "Signed" },
  { id: "expired", label: "Expired" }, { id: "terminated", label: "Terminated" },
];

export const Route = createFileRoute("/contracts")({
  head: () => ({ meta: [{ title: "Contracts · MetaEdge CRM" }] }),
  component: ContractsPage,
});

function ContractsPage() {
  const can = useCan("contracts");
  const items = useCRM((s) => s.contracts);
  const add = useCRM((s) => s.addContract);
  const update = useCRM((s) => s.updateContract);
  const setStatus = useCRM((s) => s.setContractStatus);
  const del = useCRM((s) => s.deleteContract);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return items.filter((c) => {
      const hay = `${c.title} ${c.clientName} ${c.notes ?? ""}`.toLowerCase();
      return hay.includes(needle) && (statusFilter === "all" || c.status === statusFilter);
    });
  }, [items, q, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: items.length,
      signed: items.filter((c) => c.status === "signed").length,
      pending: items.filter((c) => c.status === "draft" || c.status === "sent").length,
      expiring: items.filter((c) => c.endDate && c.endDate >= today && c.endDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) && c.status === "signed").length,
      totalValue: items.reduce((a, c) => a + (c.value || 0), 0),
    };
  }, [items]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const exportRows = (rows: Contract[] = items) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importRows = async (file: File) => {
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const o: any = {};
          headers.forEach((h, i) => (o[h] = cols[i]?.trim()));
          return o;
        });
      }
      let count = 0;
      for (const r of rows) {
        if (!r.title || !r.clientName) continue;
        add({
          title: r.title,
          clientName: r.clientName,
          startDate: r.startDate || "",
          endDate: r.endDate || "",
          value: Number(r.value) || 0,
          status: (STATUSES.map((s) => s.id) as string[]).includes(r.status) ? r.status : "draft",
          notes: r.notes || "",
        } as any);
        count++;
      }
      alert(`Imported ${count} contract${count === 1 ? "" : "s"}.`);
    } catch (e) {
      alert("Import failed: " + (e instanceof Error ? e.message : "invalid file"));
    }
  };

  if (!can) return <NoAccess module="Contracts" />;

  return (
    <div>
      <PageHeader
        title="Contracts"
        subtitle="A single source of truth for every MSA, SOW and NDA."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="font-bold">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportRows()} className="font-bold">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importRows(f); e.target.value = ""; }}
            />
            <NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Contract</NewButton>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<FileSignature className="h-4 w-4" />} label="Total" value={String(stats.total)} />
        <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Signed" value={String(stats.signed)} />
        <StatTile icon={<Clock className="h-4 w-4" />} label="Pending" value={String(stats.pending)} />
        <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Total Value" value={formatCurrency(stats.totalValue)} />
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#999" }} />
          <Input placeholder="Search title, client, notes…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)} className="font-bold">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
      </div>

      {showFilter && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-divider bg-card p-4">
          <div className="min-w-[200px]">
            <Label className="mb-1 block">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {statusFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>Clear</Button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Track your first agreement."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Contract</NewButton>}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-divider bg-card p-8 text-center text-sm" style={{ color: "#666" }}>
          No contracts match your filters.
        </div>
      ) : (
        <>
          {/* Bulk action bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-divider bg-card p-3">
            <label className="flex items-center gap-2 text-xs font-bold">
              <Checkbox
                checked={filtered.length > 0 && filtered.every((c) => selected.has(c.id))}
                onCheckedChange={(v) => {
                  if (v) setSelected(new Set(filtered.map((c) => c.id)));
                  else setSelected(new Set());
                }}
              />
              Select all
            </label>
            <span className="text-xs" style={{ color: "#666" }}>{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => exportRows(items.filter((c) => selected.has(c.id)))}
                className="font-bold"
              >
                <Download className="h-3.5 w-3.5" /> Export selected
              </Button>
              <Select
                value={bulkStatus}
                onValueChange={(v) => {
                  setBulkStatus(v);
                  selected.forEach((id) => setStatus(id, v as ContractStatus));
                  setBulkStatus("");
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs" disabled={selected.size === 0}>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => {
                  if (!confirm(`Delete ${selected.size} contract${selected.size === 1 ? "" : "s"}?`)) return;
                  selected.forEach((id) => del(id));
                  setSelected(new Set());
                }}
                className="font-bold text-primary"
              >
                Delete selected
              </Button>
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-divider bg-card brand-shadow">
            <table className="w-full text-sm">
              <thead className="border-b border-divider bg-muted/40 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#666" }}>
                <tr>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-4 py-3 text-left font-bold">Title</th>
                  <th className="px-4 py-3 text-left font-bold">Client</th>
                  <th className="px-4 py-3 text-left font-bold">Start</th>
                  <th className="px-4 py-3 text-left font-bold">End</th>
                  <th className="px-4 py-3 text-right font-bold">Value</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-divider last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><ScrollText className="h-3.5 w-3.5 text-primary" /><span className="font-bold">{c.title}</span></span></td>
                    <td className="px-4 py-3">{c.clientName}</td>
                    <td className="px-4 py-3">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3 text-right font-black">{formatCurrency(c.value)}</td>
                    <td className="px-4 py-3">
                      <Select value={c.status} onValueChange={(v) => setStatus(c.id, v as ContractStatus)}>
                        <SelectTrigger className="h-7 w-[130px] text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ContractDialog open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(d) => { if (editing) update(editing.id, d); else add(d); setOpen(false); }} />
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-divider bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
        {icon} {label}
      </div>
      <div className="mt-1.5 text-2xl font-black">{value}</div>
    </div>
  );
}

function ContractDialog({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: Contract | null;
  onSave: (d: Omit<Contract, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<Contract, "id" | "createdAt">>({
    title: "", clientName: "", startDate: "", endDate: "", value: 0, status: "draft", notes: "",
  });
  useEffect(() => {
    if (open) {
      if (editing) { const { id: _i, createdAt: _c, ...r } = editing; setForm(r); }
      else setForm({ title: "", clientName: "", startDate: "", endDate: "", value: 0, status: "draft", notes: "" });
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Client *</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
            <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>End date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.title.trim() || !form.clientName.trim()) return; onSave(form); }} className="font-bold">
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
