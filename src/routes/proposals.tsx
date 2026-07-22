import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate, formatCurrency } from "@/lib/crm/hooks";
import type { Proposal, ProposalStatus } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit } from "lucide-react";

const STATUSES: { id: ProposalStatus; label: string }[] = [
  { id: "draft", label: "Draft" }, { id: "sent", label: "Sent" }, { id: "viewed", label: "Viewed" },
  { id: "accepted", label: "Accepted" }, { id: "rejected", label: "Rejected" },
];

export const Route = createFileRoute("/proposals")({
  head: () => ({ meta: [{ title: "Proposals · MetaEdge CRM" }] }),
  component: ProposalsPage,
});

function ProposalsPage() {
  const can = useCan("proposals");
  const items = useCRM((s) => s.proposals);
  const add = useCRM((s) => s.addProposal);
  const update = useCRM((s) => s.updateProposal);
  const setStatus = useCRM((s) => s.setProposalStatus);
  const del = useCRM((s) => s.deleteProposal);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  if (!can) return <NoAccess module="Proposals" />;

  return (
    <div>
      <PageHeader title="Proposals" subtitle="Track proposals from draft to accepted."
        actions={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Proposal</NewButton>} />
      {items.length === 0 ? (
        <EmptyState title="No proposals yet" description="Draft your first proposal to send to a client."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Proposal</NewButton>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-divider bg-card p-5 brand-shadow">
              <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-base font-black">{p.title}</div>
                  <div className="text-[11px]" style={{ color: "#999" }}>{p.clientName}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del(p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-primary">{formatCurrency(p.value)}</div>
              <div className="mt-3 flex items-center justify-between">
                <Select value={p.status} onValueChange={(v) => setStatus(p.id, v as ProposalStatus)}>
                  <SelectTrigger className="h-7 w-[130px] text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-[11px]" style={{ color: "#999" }}>{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProposalDialog open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(d) => { if (editing) update(editing.id, d); else add(d); setOpen(false); }} />
    </div>
  );
}

function ProposalDialog({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: Proposal | null;
  onSave: (d: Omit<Proposal, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<Proposal, "id" | "createdAt">>({
    title: "", clientName: "", value: 0, status: "draft", content: "",
  });
  useEffect(() => {
    if (open) {
      if (editing) { const { id: _i, createdAt: _c, ...r } = editing; setForm(r); }
      else setForm({ title: "", clientName: "", value: 0, status: "draft", content: "" });
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Proposal" : "New Proposal"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Client *</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
            <div><Label>Value ($)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProposalStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Content / Scope</Label><Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
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
