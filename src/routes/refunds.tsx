import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { Undo2, Download, Upload, Search, Plus, Pencil, Trash2, ArrowLeft, Save, TrendingDown, RefreshCcw, AlertCircle } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { formatCurrency, formatDate } from "@/lib/crm/hooks";
import type { ListItem } from "@/lib/crm/types";

export const Route = createFileRoute("/refunds")({
  head: () => ({ meta: [{ title: "Refunds · MetaEdge CRM" }] }),
  component: RefundsPage,
});

const EMPTY: ListItem[] = [];
const LIST_KEY = "refunds";

const REASONS = ["Customer request", "Duplicate charge", "Fraud", "Product/service issue", "Cancellation", "Other"];
const METHODS = ["Original payment method", "Bank Transfer", "Store credit", "Cash", "Cheque"];
const STATUSES = ["requested", "approved", "processing", "refunded", "rejected"];

interface RefundForm {
  name: string;
  paymentRef: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  originalAmount: string;
  amount: string;
  currency: string;
  method: string;
  reason: string;
  status: string;
  date: string;
  notes: string;
}

const emptyForm = (): RefundForm => ({
  name: `REF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  paymentRef: "",
  invoiceNumber: "",
  clientName: "",
  clientEmail: "",
  originalAmount: "",
  amount: "",
  currency: "USD",
  method: "Original payment method",
  reason: "Customer request",
  status: "requested",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
});

function refundPDF(r: RefundForm) {
  const doc = new jsPDF();
  doc.setFillColor(191, 24, 51);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("REFUND NOTE", 15, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MetaEdge Creatives", 195, 15, { align: "right" });
  doc.text("info@metaedgecreatives.com", 195, 21, { align: "right" });

  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Refund #${r.name}`, 15, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: ${r.date}`, 15, 55);
  doc.text(`Status: ${r.status.toUpperCase()}`, 15, 61);
  if (r.paymentRef) doc.text(`Original payment: ${r.paymentRef}`, 15, 67);
  if (r.invoiceNumber) doc.text(`Invoice: ${r.invoiceNumber}`, 15, 73);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text("REFUNDED TO", 130, 48);
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(10);
  doc.text(r.clientName || "—", 130, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (r.clientEmail) doc.text(r.clientEmail, 130, 60);

  const y = 90;
  doc.setFillColor(253, 245, 247);
  doc.rect(15, y, 180, 40, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(191, 24, 51);
  doc.text("REASON", 22, y + 10);
  doc.text("METHOD", 22, y + 26);
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(r.reason, 22, y + 16);
  doc.text(r.method, 22, y + 32);

  doc.setFillColor(191, 24, 51);
  doc.rect(120, y, 75, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REFUND AMOUNT", 127, y + 12);
  doc.setFontSize(18);
  doc.text(`${r.currency} ${Number(r.amount || 0).toFixed(2)}`, 127, y + 26);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (r.originalAmount) doc.text(`of ${r.currency} ${Number(r.originalAmount).toFixed(2)} original`, 127, y + 34);

  if (r.notes) {
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTES", 15, y + 55);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    const notes = doc.splitTextToSize(r.notes, 180);
    doc.text(notes, 15, y + 61);
  }

  doc.setDrawColor(191, 24, 51);
  doc.line(15, 285, 195, 285);
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text("Refund processed by MetaEdge Creatives.", 105, 291, { align: "center" });
  return doc;
}

function readForm(it: ListItem): RefundForm {
  const m = (it.meta ?? {}) as Record<string, string>;
  return {
    name: it.name ?? "",
    paymentRef: m.paymentRef ?? "",
    invoiceNumber: m.invoiceNumber ?? "",
    clientName: m.clientName ?? "",
    clientEmail: m.clientEmail ?? "",
    originalAmount: m.originalAmount ?? "",
    amount: m.amount ?? "",
    currency: m.currency ?? "USD",
    method: m.method ?? "Original payment method",
    reason: m.reason ?? "Customer request",
    status: m.status ?? "requested",
    date: m.date ?? new Date().toISOString().slice(0, 10),
    notes: it.description ?? "",
  };
}

function RefundsPage() {
  const items = useCRM((s) => s.lists[LIST_KEY]) ?? EMPTY;
  const add = useCRM((s) => s.addListItem);
  const update = useCRM((s) => s.updateListItem);
  const remove = useCRM((s) => s.deleteListItem);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [form, setForm] = useState<RefundForm>(emptyForm());
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const m = (it.meta ?? {}) as Record<string, string>;
      if (statusFilter !== "all" && (m.status ?? "requested") !== statusFilter) return false;
      if (!q) return true;
      return [it.name, m.clientName, m.invoiceNumber, m.paymentRef, m.reason].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, query, statusFilter]);

  const stats = useMemo(() => {
    let refunded = 0, pending = 0, count = 0;
    items.forEach((it) => {
      const m = (it.meta ?? {}) as Record<string, string>;
      const amt = Number(m.amount || 0);
      if (m.status === "refunded") refunded += amt;
      else if (m.status === "requested" || m.status === "approved" || m.status === "processing") pending += amt;
      count++;
    });
    return { refunded, pending, count };
  }, [items]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setMode("edit"); };
  const openEdit = (it: ListItem) => { setEditing(it); setForm(readForm(it)); setMode("edit"); };

  const save = () => {
    if (!form.name.trim() || !form.amount) return;
    const meta = {
      paymentRef: form.paymentRef, invoiceNumber: form.invoiceNumber,
      clientName: form.clientName, clientEmail: form.clientEmail,
      originalAmount: form.originalAmount, amount: form.amount, currency: form.currency,
      method: form.method, reason: form.reason, status: form.status, date: form.date,
    };
    if (editing) update(LIST_KEY, editing.id, { name: form.name, description: form.notes || undefined, meta });
    else add(LIST_KEY, { name: form.name, description: form.notes || undefined, meta });
    setMode("list"); setEditing(null);
  };

  const download = (it: ListItem) => refundPDF(readForm(it)).save(`${it.name}.pdf`);

  const setStatus = (it: ListItem, status: string) => {
    update(LIST_KEY, it.id, { meta: { ...(it.meta ?? {}), status } });
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((it) => selected[it.id]);
  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelected({});
    else { const n: Record<string, boolean> = {}; filtered.forEach((it) => { n[it.id] = true; }); setSelected(n); }
  };
  const exportJSON = (list: ListItem[]) => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `refunds-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const exportCSV = (list: ListItem[]) => {
    const headers = ["name","paymentRef","invoiceNumber","clientName","clientEmail","originalAmount","amount","currency","method","reason","status","date","notes"];
    const rows = list.map((it) => { const f = readForm(it); return headers.map((h) => JSON.stringify((f as any)[h] ?? "")).join(","); });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `refunds-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const [head, ...rest] = text.split(/\r?\n/).filter(Boolean);
        const hs = head.split(",").map((h) => h.trim());
        rows = rest.map((line) => {
          const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
          const o: any = {}; hs.forEach((h, i) => { o[h] = cells[i] ?? ""; }); return o;
        });
      } else { rows = JSON.parse(text); }
      let count = 0;
      rows.forEach((r) => {
        const name = r.name ?? r.title ?? r.meta?.name;
        if (!name) return;
        const src = r.meta && typeof r.meta === "object" ? { ...r.meta, notes: r.description } : r;
        add(LIST_KEY, {
          name: String(name),
          description: src.notes || r.description || undefined,
          meta: {
            paymentRef: src.paymentRef || "", invoiceNumber: src.invoiceNumber || "",
            clientName: src.clientName || "", clientEmail: src.clientEmail || "",
            originalAmount: String(src.originalAmount || ""), amount: String(src.amount || ""),
            currency: src.currency || "USD", method: src.method || "Original payment method",
            reason: src.reason || "Customer request", status: src.status || "requested",
            date: src.date || new Date().toISOString().slice(0, 10),
          },
        });
        count++;
      });
      alert(`Imported ${count} refund(s).`);
    } catch { alert("Import failed. Upload a valid JSON or CSV file."); }
  };


  if (mode === "edit") {
    return (
      <div className="space-y-6">
        <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <button onClick={() => setMode("list")} className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Refunds</div>
              <h2 className="text-lg font-black" style={{ color: "#2A1418" }}>{editing ? "Edit refund" : "Issue refund"}</h2>
            </div>
          </div>
          <button onClick={save} className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] hover:-translate-y-0.5 transition">
            <Save className="h-4 w-4" /> {editing ? "Save changes" : "Create"}
          </button>
        </div>

        <div className="widget-card p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Refund #"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} /></Field>
            <Field label="Payment reference"><input value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} className={inp} placeholder="PAY-2026-1001" /></Field>
            <Field label="Invoice #"><input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className={inp} /></Field>
            <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inp} /></Field>
            <Field label="Client name"><input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={inp} /></Field>
            <Field label="Client email"><input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} className={inp} /></Field>
            <Field label="Original amount"><input type="number" step="0.01" value={form.originalAmount} onChange={(e) => setForm({ ...form, originalAmount: e.target.value })} className={inp} /></Field>
            <Field label="Refund amount"><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inp} /></Field>
            <Field label="Currency"><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className={inp} /></Field>
            <Field label="Method">
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inp}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Reason">
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inp}>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes"><textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} /></Field>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Undo2 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-black" style={{ color: "#2A1418" }}>Refunds</h2>
            <p className="text-xs" style={{ color: "#7A6870" }}>Issue and track refunds with signed refund notes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="glass-chip w-56 rounded-2xl py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="glass-chip rounded-2xl px-3 py-2.5 text-sm">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button onClick={() => exportJSON(filtered)} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] hover:-translate-y-0.5 transition">
            <Plus className="h-4 w-4" /> Issue refund
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={RefreshCcw} label="Refunded" value={formatCurrency(stats.refunded)} />
        <StatCard icon={AlertCircle} label="Pending" value={formatCurrency(stats.pending)} />
        <StatCard icon={TrendingDown} label="Total refunds" value={String(stats.count)} />
      </div>

      {selectedIds.length > 0 && (
        <div className="widget-card flex flex-wrap items-center gap-3 p-4">
          <div className="text-sm font-bold text-primary">{selectedIds.length} selected</div>
          <button onClick={toggleSelectAll} className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10">
            {allFilteredSelected ? "Unselect all" : "Select all filtered"}
          </button>
          <button onClick={() => exportJSON(items.filter((it) => selected[it.id]))} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10">
            <Download className="h-3.5 w-3.5" /> Export selected
          </button>
          <button onClick={() => { selectedIds.forEach((id) => { const it = items.find((x) => x.id === id); if (it) download(it); }); }} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10">
            <Download className="h-3.5 w-3.5" /> Download PDFs
          </button>
          <select onChange={(e) => { const v = e.target.value; if (!v) return; selectedIds.forEach((id) => { const it = items.find((x) => x.id === id); if (it) setStatus(it, v); }); e.target.value = ""; }} className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold text-primary">
            <option value="">Change status…</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => { if (confirm(`Delete ${selectedIds.length} refund(s)?`)) { selectedIds.forEach((id) => remove(LIST_KEY, id)); setSelected({}); } }} className="ml-auto flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white hover:-translate-y-0.5 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </button>
        </div>
      )}

      <div className="widget-card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><Undo2 className="h-6 w-6 text-primary" /></div>
            <div className="text-sm font-black" style={{ color: "#2A1418" }}>No refunds yet</div>
            <div className="mt-1 text-xs" style={{ color: "#7A6870" }}>Click "Issue refund" to record your first refund.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-primary">
                <th className="px-5 py-3 w-8"><input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} /></th>
                <th className="px-5 py-3">Refund #</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const m = (it.meta ?? {}) as Record<string, string>;
                return (
                  <tr key={it.id} className="border-t border-black/5 hover:bg-primary/5">
                    <td className="px-5 py-3"><input type="checkbox" checked={!!selected[it.id]} onChange={() => toggleSelect(it.id)} /></td>
                    <td className="px-5 py-3 font-bold text-[#2A1418]">{it.name}</td>
                    <td className="px-5 py-3">{m.clientName || <span className="text-black/30">—</span>}</td>
                    <td className="px-5 py-3">{m.paymentRef || <span className="text-black/30">—</span>}</td>
                    <td className="px-5 py-3">{m.reason || "—"}</td>
                    <td className="px-5 py-3">{m.date ? formatDate(m.date) : "—"}</td>
                    <td className="px-5 py-3 text-right font-black">{m.currency || "USD"} {Number(m.amount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <select value={m.status ?? "requested"} onChange={(e) => setStatus(it, e.target.value)} className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest outline-none">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => download(it)} className="rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Refund note PDF"><Download className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(it)} className="rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { if (confirm("Delete refund?")) remove(LIST_KEY, it.id); }} className="rounded-lg p-1.5 text-primary hover:bg-primary/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-primary">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="widget-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</div>
          <div className="text-2xl font-black" style={{ color: "#2A1418" }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
