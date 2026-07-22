import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate, formatCurrency } from "@/lib/crm/hooks";
import { INVOICE_STATUSES, type Invoice, type InvoiceLineItem, type InvoiceStatus } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Mail, Trash2, Plus, Edit, FileText, Upload, Search, Filter, DollarSign, AlertTriangle, CheckCircle2, Receipt } from "lucide-react";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoices · MetaEdge CRM" }] }),
  component: InvoicesPage,
});

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyInvoice = (): Omit<Invoice, "id" | "createdAt"> => ({
  number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  currency: "USD",
  taxRate: 0,
  discount: 0,
  notes: "",
  items: [{ id: uid(), description: "", quantity: 1, unitPrice: 0 }],
  status: "draft",
});

function computeTotals(inv: { items: InvoiceLineItem[]; taxRate: number; discount: number }) {
  const subtotal = inv.items.reduce((a, i) => a + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const discountAmount = subtotal * ((inv.discount || 0) / 100);
  const taxable = subtotal - discountAmount;
  const tax = taxable * ((inv.taxRate || 0) / 100);
  const total = taxable + tax;
  return { subtotal, discountAmount, tax, total };
}

function generatePDF(inv: Invoice) {
  const doc = new jsPDF();
  const totals = computeTotals(inv);

  // Header band
  doc.setFillColor(191, 24, 51);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", 15, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MetaEdge Creatives", 195, 15, { align: "right" });
  doc.text("info@metaedgecreatives.com", 195, 21, { align: "right" });
  doc.text("metaedgecreatives.com", 195, 27, { align: "right" });

  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice #${inv.number}`, 15, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Issued: ${inv.issueDate}`, 15, 51);
  if (inv.dueDate) doc.text(`Due: ${inv.dueDate}`, 15, 56);
  doc.text(`Status: ${inv.status.toUpperCase()}`, 15, 61);

  // Bill to
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text("BILL TO", 130, 45);
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(10);
  doc.text(inv.clientName || "—", 130, 51);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (inv.clientEmail) doc.text(inv.clientEmail, 130, 57);
  if (inv.clientAddress) {
    const lines = doc.splitTextToSize(inv.clientAddress, 65);
    doc.text(lines, 130, 63);
  }

  // Items table
  const startY = 78;
  doc.setFillColor(253, 245, 247);
  doc.rect(15, startY, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(191, 24, 51);
  doc.text("DESCRIPTION", 18, startY + 5.5);
  doc.text("QTY", 130, startY + 5.5, { align: "right" });
  doc.text("PRICE", 155, startY + 5.5, { align: "right" });
  doc.text("AMOUNT", 192, startY + 5.5, { align: "right" });

  let y = startY + 12;
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  inv.items.forEach((it) => {
    const desc = doc.splitTextToSize(it.description || "—", 105);
    doc.text(desc, 18, y);
    doc.text(String(it.quantity), 130, y, { align: "right" });
    doc.text(it.unitPrice.toFixed(2), 155, y, { align: "right" });
    doc.text((it.quantity * it.unitPrice).toFixed(2), 192, y, { align: "right" });
    y += Math.max(6, desc.length * 5);
    doc.setDrawColor(240, 240, 240);
    doc.line(15, y - 2, 195, y - 2);
  });

  // Totals
  y += 4;
  const totalsX = 140;
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(17, 17, 17);
  doc.text(`${inv.currency} ${totals.subtotal.toFixed(2)}`, 192, y, { align: "right" });
  y += 6;
  if (inv.discount > 0) {
    doc.setTextColor(102, 102, 102);
    doc.text(`Discount (${inv.discount}%)`, totalsX, y);
    doc.setTextColor(17, 17, 17);
    doc.text(`- ${inv.currency} ${totals.discountAmount.toFixed(2)}`, 192, y, { align: "right" });
    y += 6;
  }
  if (inv.taxRate > 0) {
    doc.setTextColor(102, 102, 102);
    doc.text(`Tax (${inv.taxRate}%)`, totalsX, y);
    doc.setTextColor(17, 17, 17);
    doc.text(`${inv.currency} ${totals.tax.toFixed(2)}`, 192, y, { align: "right" });
    y += 6;
  }
  doc.setFillColor(191, 24, 51);
  doc.rect(totalsX - 5, y - 2, 60, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", totalsX, y + 5);
  doc.text(`${inv.currency} ${totals.total.toFixed(2)}`, 192, y + 5, { align: "right" });

  if (inv.notes) {
    y += 20;
    doc.setTextColor(102, 102, 102);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTES", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    const notes = doc.splitTextToSize(inv.notes, 180);
    doc.text(notes, 15, y + 5);
  }

  // Footer
  doc.setDrawColor(191, 24, 51);
  doc.setLineWidth(0.5);
  doc.line(15, 285, 195, 285);
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text("Thank you for working with MetaEdge Creatives.", 105, 291, { align: "center" });

  return doc;
}

function InvoicesPage() {
  const can = useCan("invoices");
  const invoices = useCRM((s) => s.invoices);
  const emailConfig = useCRM((s) => s.emailConfig);
  const addInvoice = useCRM((s) => s.addInvoice);
  const updateInvoice = useCRM((s) => s.updateInvoice);
  const setInvoiceStatus = useCRM((s) => s.setInvoiceStatus);
  const deleteInvoice = useCRM((s) => s.deleteInvoice);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return invoices.filter((i) => {
      const matchesQ =
        !needle ||
        i.number.toLowerCase().includes(needle) ||
        i.clientName.toLowerCase().includes(needle) ||
        (i.clientEmail ?? "").toLowerCase().includes(needle);
      const matchesS = statusFilter === "all" || i.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [invoices, q, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const paid = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + computeTotals(i).total, 0);
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((a, i) => a + computeTotals(i).total, 0);
    const overdue = invoices.filter((i) => i.status !== "paid" && i.dueDate && i.dueDate < today).length;
    return { count: invoices.length, paid, outstanding, overdue };
  }, [invoices]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const exportInvoices = (rows: Invoice[] = invoices) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importInvoices = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rows: any[] = Array.isArray(parsed) ? parsed : [parsed];
      let count = 0;
      for (const r of rows) {
        if (!r.number && !r.clientName) continue;
        const base = emptyInvoice();
        addInvoice({
          ...base,
          ...r,
          items: Array.isArray(r.items) && r.items.length ? r.items : base.items,
        });
        count++;
      }
      alert(`Imported ${count} invoice${count === 1 ? "" : "s"}.`);
    } catch (e) {
      alert("Import failed: " + (e instanceof Error ? e.message : "invalid file"));
    }
  };

  if (!can) return <NoAccess module="Invoices" />;

  const download = (inv: Invoice) => {
    const doc = generatePDF(inv);
    doc.save(`${inv.number}.pdf`);
  };

  const emailInvoice = async (inv: Invoice) => {
    if (!inv.clientEmail) {
      alert("Add a client email first.");
      return;
    }
    const doc = generatePDF(inv);
    const totalsCalc = computeTotals(inv);
    const subject = `Invoice ${inv.number} from MetaEdge Creatives`;
    const body = `Hi ${inv.clientName},\n\nPlease find attached invoice ${inv.number}.\n\nAmount due: ${inv.currency} ${totalsCalc.total.toFixed(2)}\nDue date: ${inv.dueDate || "—"}\n\nThank you,\n${emailConfig.fromName}`;

    if (emailConfig.provider !== "none" && emailConfig.apiKey) {
      doc.save(`${inv.number}.pdf`);
      alert(`Invoice sent to ${inv.clientEmail} via ${emailConfig.provider.toUpperCase()} (simulated).\nThe PDF was also downloaded.`);
      if (inv.status === "draft") setInvoiceStatus(inv.id, "sent");
      return;
    }

    doc.save(`${inv.number}.pdf`);
    window.location.href = `mailto:${inv.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + "\n\n(PDF attached — please attach the downloaded file.)")}`;
    if (inv.status === "draft") setInvoiceStatus(inv.id, "sent");
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Create, download and email invoices to your clients."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="font-bold">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportInvoices()} className="font-bold">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importInvoices(f); e.target.value = ""; }}
            />
            <NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Invoice</NewButton>
          </div>
        }
      />

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Receipt className="h-4 w-4" />} label="Total" value={String(stats.count)} />
        <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Paid" value={formatCurrency(stats.paid)} />
        <StatTile icon={<DollarSign className="h-4 w-4" />} label="Outstanding" value={formatCurrency(stats.outstanding)} />
        <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={String(stats.overdue)} />
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#999" }} />
          <Input placeholder="Search invoice # or client…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
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
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {statusFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>Clear</Button>
          )}
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice, download the PDF, or send it to your client."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Invoice</NewButton>}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-divider bg-card p-8 text-center text-sm" style={{ color: "#666" }}>
          No invoices match your filters.
        </div>
      ) : (
        <>
          {/* Bulk action bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-divider bg-card p-3">
            <label className="flex items-center gap-2 text-xs font-bold">
              <Checkbox
                checked={filtered.length > 0 && filtered.every((i) => selected.has(i.id))}
                onCheckedChange={(v) => {
                  if (v) setSelected(new Set(filtered.map((i) => i.id)));
                  else setSelected(new Set());
                }}
              />
              Select all
            </label>
            <span className="text-xs" style={{ color: "#666" }}>{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => exportInvoices(invoices.filter((i) => selected.has(i.id)))}
                className="font-bold"
              >
                <Download className="h-3.5 w-3.5" /> Export selected
              </Button>
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => {
                  invoices.filter((i) => selected.has(i.id)).forEach((inv) => generatePDF(inv).save(`${inv.number}.pdf`));
                }}
                className="font-bold"
              >
                <FileText className="h-3.5 w-3.5" /> Download PDFs
              </Button>
              <Select
                value={bulkStatus}
                onValueChange={(v) => {
                  setBulkStatus(v);
                  selected.forEach((id) => setInvoiceStatus(id, v as InvoiceStatus));
                  setBulkStatus("");
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs" disabled={selected.size === 0}>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => {
                  if (!confirm(`Delete ${selected.size} invoice${selected.size === 1 ? "" : "s"}?`)) return;
                  selected.forEach((id) => deleteInvoice(id));
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
                  <th className="px-4 py-3 text-left font-bold">Invoice #</th>
                  <th className="px-4 py-3 text-left font-bold">Client</th>
                  <th className="px-4 py-3 text-left font-bold">Issued</th>
                  <th className="px-4 py-3 text-left font-bold">Due</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const t = computeTotals(inv);
                  return (
                    <tr key={inv.id} className="border-b border-divider last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-3">
                        <Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggle(inv.id)} />
                      </td>
                      <td className="px-4 py-3 font-bold">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          {inv.number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{inv.clientName || "—"}</div>
                        <div className="text-[11px]" style={{ color: "#999" }}>{inv.clientEmail}</div>
                      </td>
                      <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                      <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right font-black">{inv.currency} {t.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Select value={inv.status} onValueChange={(v) => setInvoiceStatus(inv.id, v as InvoiceStatus)}>
                          <SelectTrigger className="h-7 w-[110px] text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INVOICE_STATUSES.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => download(inv)} title="Download PDF">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => emailInvoice(inv)} title="Email to client">
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditing(inv); setOpen(true); }} title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete invoice?")) deleteInvoice(inv.id); }} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <InvoiceDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateInvoice(editing.id, data);
          else addInvoice(data);
          setOpen(false);
        }}
      />
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

function InvoiceDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Invoice | null;
  onSave: (data: Omit<Invoice, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<Invoice, "id" | "createdAt">>(emptyInvoice());

  // reset form when opening
  useMemo(() => {
    if (open) {
      if (editing) {
        const { id: _i, createdAt: _c, ...rest } = editing;
        setForm(rest);
      } else {
        setForm(emptyInvoice());
      }
    }
  }, [open, editing]);

  const totals = computeTotals(form);

  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) =>
    setForm({ ...form, items: form.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const removeItem = (id: string) =>
    setForm({ ...form, items: form.items.filter((i) => i.id !== id) });

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { id: uid(), description: "", quantity: 1, unitPrice: 0 }] });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Invoice #</Label>
              <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client name *</Label>
              <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            </div>
            <div>
              <Label>Client email</Label>
              <Input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Client address</Label>
            <Textarea rows={2} value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue date</Label>
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Line items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1fr_80px_100px_100px_auto] gap-2 items-center">
                  <Input placeholder="Description / service" value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} />
                  <Input type="number" min={0} value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })} />
                  <Input type="number" min={0} step="0.01" value={it.unitPrice} onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })} />
                  <div className="text-right text-sm font-bold">{(it.quantity * it.unitPrice).toFixed(2)}</div>
                  <Button type="button" size="sm" variant="outline" onClick={() => removeItem(it.id)} disabled={form.items.length === 1}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tax rate (%)</Label>
              <Input type="number" min={0} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Discount (%)</Label>
              <Input type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, thank-you message…" />
          </div>

          <div className="rounded-lg border border-divider bg-accent/40 p-4">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{form.currency} {totals.subtotal.toFixed(2)}</span></div>
            {form.discount > 0 && <div className="flex justify-between text-sm"><span>Discount</span><span>- {form.currency} {totals.discountAmount.toFixed(2)}</span></div>}
            {form.taxRate > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>{form.currency} {totals.tax.toFixed(2)}</span></div>}
            <div className="mt-2 flex justify-between border-t border-divider pt-2 text-base font-black text-primary">
              <span>Total</span><span>{form.currency} {totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.clientName.trim()) { alert("Client name is required."); return; }
            onSave(form);
          }} className="font-bold">{editing ? "Save changes" : "Create invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}