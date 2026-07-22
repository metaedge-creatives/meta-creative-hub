import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import type { SupportTicket, TicketPriority, TicketStatus } from "@/lib/crm/types";
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
import { Trash2, Edit, LifeBuoy } from "lucide-react";

const PRIORITIES: { id: TicketPriority; label: string; color: string }[] = [
  { id: "low", label: "Low", color: "#94A3B8" },
  { id: "normal", label: "Normal", color: "#3B82F6" },
  { id: "high", label: "High", color: "#F59E0B" },
  { id: "urgent", label: "Urgent", color: "#BF1833" },
];
const STATUSES: { id: TicketStatus; label: string }[] = [
  { id: "open", label: "Open" }, { id: "in_progress", label: "In progress" },
  { id: "waiting", label: "Waiting" }, { id: "resolved", label: "Resolved" }, { id: "closed", label: "Closed" },
];

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support · MetaEdge CRM" }] }),
  component: SupportPage,
});

function SupportPage() {
  const can = useCan("support");
  const items = useCRM((s) => s.tickets);
  const add = useCRM((s) => s.addTicket);
  const update = useCRM((s) => s.updateTicket);
  const setStatus = useCRM((s) => s.setTicketStatus);
  const del = useCRM((s) => s.deleteTicket);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupportTicket | null>(null);
  if (!can) return <NoAccess module="Support" />;

  return (
    <div>
      <PageHeader title="Support" subtitle="A calm inbox for every client question."
        actions={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Ticket</NewButton>} />
      {items.length === 0 ? (
        <EmptyState title="No tickets yet" description="Log your first client request."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Ticket</NewButton>} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((t) => {
            const pri = PRIORITIES.find((p) => p.id === t.priority)!;
            return (
              <div key={t.id} className="rounded-xl border border-divider bg-card p-4 brand-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent"><LifeBuoy className="h-4 w-4 text-primary" /></span>
                    <div className="min-w-0">
                      <div className="text-sm font-black">{t.subject}</div>
                      <div className="text-[11px]" style={{ color: "#999" }}>{t.clientName}{t.clientEmail ? ` · ${t.clientEmail}` : ""} · {formatDate(t.createdAt)}</div>
                      {t.description && <p className="mt-2 text-[12px]" style={{ color: "#666" }}>{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: pri.color }}>{pri.label}</span>
                    <Select value={t.status} onValueChange={(v) => setStatus(t.id, v as TicketStatus)}>
                      <SelectTrigger className="h-7 w-[130px] text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(t); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TicketDialog open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(d) => { if (editing) update(editing.id, d); else add(d); setOpen(false); }} />
    </div>
  );
}

function TicketDialog({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: SupportTicket | null;
  onSave: (d: Omit<SupportTicket, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<SupportTicket, "id" | "createdAt">>({
    subject: "", clientName: "", clientEmail: "", priority: "normal", status: "open", description: "",
  });
  useEffect(() => {
    if (open) {
      if (editing) { const { id: _i, createdAt: _c, ...r } = editing; setForm(r); }
      else setForm({ subject: "", clientName: "", clientEmail: "", priority: "normal", status: "open", description: "" });
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Ticket" : "New Ticket"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Client *</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
            <div><Label>Client email</Label><Input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TicketPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TicketStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.subject.trim() || !form.clientName.trim()) return; onSave(form); }} className="font-bold">
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
