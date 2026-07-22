import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Calculator, Plus, Trash2, Send, Download, Search } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { PageHeader } from "@/components/crm/PageHeader";
import { NewButton } from "@/components/crm/NewButton";
import { EmptyState } from "@/components/crm/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ListItem } from "@/lib/crm/types";

export const Route = createFileRoute("/estimates")({
  head: () => ({ meta: [{ title: "Estimates · MetaEdge CRM" }] }),
  component: EstimatesPage,
});

type LineItem = { id: string; description: string; quantity: number; unitPrice: number };
type EstStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
type EstMeta = {
  number?: string;
  client?: string;
  clientEmail?: string;
  project?: string;
  issueDate?: string;
  expiryDate?: string;
  category?: string;
  tags?: string;
  notes?: string;
  terms?: string;
  items?: LineItem[];
  taxRate?: number;
  discount?: number;
  status?: EstStatus;
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const EMPTY_ITEMS: ListItem[] = [];

function totals(m: EstMeta) {
  const sub = (m.items ?? []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = Number(m.discount ?? 0);
  const taxRate = Number(m.taxRate ?? 0);
  const afterDisc = Math.max(0, sub - discount);
  const tax = (afterDisc * taxRate) / 100;
  return { sub, discount, tax, total: afterDisc + tax };
}

function EstimatesPage() {
  const items = useCRM((s) => s.lists["estimates"] ?? EMPTY_ITEMS);
  const add = useCRM((s) => s.addListItem);
  const del = useCRM((s) => s.deleteListItem);
  const update = useCRM((s) => s.updateListItem);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<ListItem | null>(null);

  const filtered = useMemo(() => items.filter((i) => {
    const m = (i.meta ?? {}) as EstMeta;
    const s = q.toLowerCase();
    return !s || i.name.toLowerCase().includes(s) || (m.client ?? "").toLowerCase().includes(s) || (m.number ?? "").toLowerCase().includes(s);
  }), [items, q]);

  const stats = useMemo(() => {
    const totalsSum = items.reduce((sum, i) => sum + totals((i.meta ?? {}) as EstMeta).total, 0);
    const byStatus = (st: EstStatus) => items.filter((i) => ((i.meta as EstMeta)?.status ?? "draft") === st).length;
    return {
      total: items.length,
      draft: byStatus("draft"),
      sent: byStatus("sent"),
      accepted: byStatus("accepted"),
      value: totalsSum,
    };
  }, [items]);

  const create = () => {
    const it = add("estimates", {
      name: "New Estimate",
      meta: {
        number: `EST-${String(items.length + 1).padStart(4, "0")}`,
        issueDate: new Date().toISOString().slice(0, 10),
        items: [],
        taxRate: 0,
        discount: 0,
        status: "draft" as EstStatus,
      } as EstMeta,
    });
    setEdit(it);
  };

  return (
    <div>
      <PageHeader title="Estimates" subtitle={`${items.length} estimates · $${stats.value.toFixed(2)} total`}
        actions={<NewButton onClick={create}>New Estimate</NewButton>} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Total", stats.total],
          ["Draft", stats.draft],
          ["Sent", stats.sent],
          ["Accepted", stats.accepted],
          ["Value", `$${stats.value.toFixed(0)}`],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-md border border-divider bg-card p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#999" }}>{l}</div>
            <div className="mt-1 text-lg font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#999" }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search estimate #, client, title…" className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No estimates yet" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-divider bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Issue</th>
                <th className="px-3 py-2">Expiry</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const m = (i.meta ?? {}) as EstMeta;
                const t = totals(m);
                const status = m.status ?? "draft";
                return (
                  <tr key={i.id} className="border-t border-divider">
                    <td className="px-3 py-2 font-mono text-xs">{m.number ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold">{i.name}</td>
                    <td className="px-3 py-2">{m.client ?? "—"}</td>
                    <td className="px-3 py-2">{m.issueDate ?? "—"}</td>
                    <td className="px-3 py-2">{m.expiryDate ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold">${t.total.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${status === "accepted" ? "bg-emerald-100 text-emerald-700" : status === "sent" ? "bg-blue-100 text-blue-700" : status === "declined" ? "bg-red-100 text-red-700" : status === "expired" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setEdit(i)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => downloadPdf(i.name, m, t)}><Download className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this estimate?")) del("estimates", i.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <EstimateEditor
          item={edit}
          onClose={() => setEdit(null)}
          onSave={(patch) => update("estimates", edit.id, patch)}
        />
      )}
    </div>
  );
}

function downloadPdf(title: string, m: EstMeta, t: ReturnType<typeof totals>) {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.text("ESTIMATE", 14, 20);
  doc.setFontSize(10);
  doc.text(`# ${m.number ?? ""}`, 14, 28);
  doc.text(`Title: ${title}`, 14, 34);
  doc.text(`Client: ${m.client ?? ""}`, 14, 40);
  doc.text(`Issue: ${m.issueDate ?? ""}   Expiry: ${m.expiryDate ?? ""}`, 14, 46);
  let y = 60;
  doc.setFontSize(9);
  doc.text("Description", 14, y);
  doc.text("Qty", 130, y);
  doc.text("Rate", 150, y);
  doc.text("Amount", 175, y);
  y += 4; doc.line(14, y, 196, y); y += 6;
  (m.items ?? []).forEach((it) => {
    doc.text(String(it.description).slice(0, 70), 14, y);
    doc.text(String(it.quantity), 130, y);
    doc.text(`$${it.unitPrice.toFixed(2)}`, 150, y);
    doc.text(`$${(it.quantity * it.unitPrice).toFixed(2)}`, 175, y);
    y += 7;
  });
  y += 6; doc.text(`Subtotal: $${t.sub.toFixed(2)}`, 150, y); y += 6;
  doc.text(`Discount: -$${t.discount.toFixed(2)}`, 150, y); y += 6;
  doc.text(`Tax: $${t.tax.toFixed(2)}`, 150, y); y += 6;
  doc.setFontSize(12); doc.text(`TOTAL: $${t.total.toFixed(2)}`, 150, y);
  if (m.terms) { doc.setFontSize(9); doc.text("Terms:", 14, y + 14); doc.text(m.terms.slice(0, 400), 14, y + 20, { maxWidth: 180 }); }
  doc.save(`${m.number ?? "estimate"}.pdf`);
}

function EstimateEditor({ item, onClose, onSave }: { item: ListItem; onClose: () => void; onSave: (patch: Partial<ListItem>) => void }) {
  const [name, setName] = useState(item.name);
  const [m, setM] = useState<EstMeta>((item.meta ?? {}) as EstMeta);
  const t = totals(m);
  const patch = (p: Partial<EstMeta>) => setM((prev) => ({ ...prev, ...p }));
  const updateItem = (id: string, p: Partial<LineItem>) => patch({ items: (m.items ?? []).map((i) => i.id === id ? { ...i, ...p } : i) });
  const addLine = () => patch({ items: [...(m.items ?? []), { id: uid(), description: "", quantity: 1, unitPrice: 0 }] });
  const removeLine = (id: string) => patch({ items: (m.items ?? []).filter((i) => i.id !== id) });
  const save = () => { onSave({ name, meta: m }); onClose(); };
  const publish = () => { patch({ status: "sent" }); onSave({ name, meta: { ...m, status: "sent" } }); alert("Estimate published"); };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Estimate</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Title</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Estimate #</Label><Input value={m.number ?? ""} onChange={(e) => patch({ number: e.target.value })} /></div>
          <div><Label>Client</Label><Input value={m.client ?? ""} onChange={(e) => patch({ client: e.target.value })} /></div>
          <div><Label>Client Email</Label><Input value={m.clientEmail ?? ""} onChange={(e) => patch({ clientEmail: e.target.value })} /></div>
          <div><Label>Issue Date</Label><Input type="date" value={m.issueDate ?? ""} onChange={(e) => patch({ issueDate: e.target.value })} /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={m.expiryDate ?? ""} onChange={(e) => patch({ expiryDate: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={m.category ?? ""} onChange={(e) => patch({ category: e.target.value })} /></div>
          <div><Label>Tags</Label><Input value={m.tags ?? ""} onChange={(e) => patch({ tags: e.target.value })} placeholder="Comma-separated" /></div>
          <div>
            <Label>Status</Label>
            <Select value={m.status ?? "draft"} onValueChange={(v) => patch({ status: v as EstStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["draft", "sent", "accepted", "declined", "expired"] as EstStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label>Line Items</Label>
            <Button size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 h-3 w-3" />Add line</Button>
          </div>
          <div className="overflow-x-auto rounded-md border border-divider">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[10px] font-bold uppercase" style={{ color: "#666" }}>
                <tr><th className="px-2 py-1 text-left">Description</th><th className="px-2 py-1 w-20">Qty</th><th className="px-2 py-1 w-28">Rate</th><th className="px-2 py-1 w-28">Amount</th><th className="px-2 py-1 w-10"></th></tr>
              </thead>
              <tbody>
                {(m.items ?? []).map((it) => (
                  <tr key={it.id} className="border-t border-divider">
                    <td className="px-2 py-1"><Input value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} placeholder="Service / product" /></td>
                    <td className="px-2 py-1"><Input type="number" value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) || 0 })} /></td>
                    <td className="px-2 py-1"><Input type="number" value={it.unitPrice} onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })} /></td>
                    <td className="px-2 py-1 font-semibold">${(it.quantity * it.unitPrice).toFixed(2)}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="ghost" onClick={() => removeLine(it.id)}><Trash2 className="h-3 w-3" /></Button></td>
                  </tr>
                ))}
                {(m.items ?? []).length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-sm" style={{ color: "#999" }}>No lines. Click "Add line".</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <div><Label>Notes (not visible to client)</Label>
              <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={m.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} /></div>
            <div><Label>Terms &amp; Conditions</Label>
              <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={m.terms ?? ""} onChange={(e) => patch({ terms: e.target.value })} /></div>
          </div>
          <div className="space-y-2 rounded-md border border-divider p-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label>Tax Rate (%)</Label>
              <Input type="number" value={m.taxRate ?? 0} onChange={(e) => patch({ taxRate: Number(e.target.value) || 0 })} />
              <Label>Discount</Label>
              <Input type="number" value={m.discount ?? 0} onChange={(e) => patch({ discount: Number(e.target.value) || 0 })} />
            </div>
            <div className="mt-2 space-y-1 border-t border-divider pt-2 text-sm">
              <div className="flex justify-between"><span style={{ color: "#666" }}>Subtotal</span><span>${t.sub.toFixed(2)}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Discount</span><span>-${t.discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Tax</span><span>${t.tax.toFixed(2)}</span></div>
              <div className="mt-1 flex justify-between border-t border-divider pt-1 font-bold"><span>Total</span><span>${t.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => downloadPdf(name, m, t)}><Download className="mr-1 h-4 w-4" />PDF</Button>
          <Button variant="outline" onClick={publish}><Send className="mr-1 h-4 w-4" />Publish</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} className="font-bold">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
