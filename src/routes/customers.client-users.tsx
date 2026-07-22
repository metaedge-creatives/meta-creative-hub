import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate, initials } from "@/lib/crm/hooks";
import type { ClientUser, ClientUserStatus } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Send, Check } from "lucide-react";
import { toast } from "sonner";

const STATUSES: { id: ClientUserStatus; label: string; color: string; bg: string; fg: string }[] = [
  { id: "invited", label: "Invited", color: "#F59E0B", bg: "#FEF3C7", fg: "#92400E" },
  { id: "active", label: "Active", color: "#10B981", bg: "#D1FAE5", fg: "#065F46" },
  { id: "suspended", label: "Suspended", color: "#94A3B8", bg: "#E2E8F0", fg: "#475569" },
];

function StatusBadge({ status }: { status: ClientUserStatus }) {
  const st = STATUSES.find((s) => s.id === status)!;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: st.bg, color: st.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
      {st.label}
    </span>
  );
}

export const Route = createFileRoute("/customers/client-users")({
  head: () => ({ meta: [{ title: "Client Users · MetaEdge CRM" }] }),
  component: ClientUsersPage,
});

function ClientUsersPage() {
  const can = useCan("clientUsers");
  const items = useCRM((s) => s.clientUsers);
  const add = useCRM((s) => s.addClientUser);
  const update = useCRM((s) => s.updateClientUser);
  const del = useCRM((s) => s.deleteClientUser);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientUser | null>(null);
  if (!can) return <NoAccess module="Client Users" />;

  return (
    <div>
      <PageHeader title="Client Users" subtitle="Give your clients their own logins with scoped access."
        actions={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>Invite Client</NewButton>} />
      {items.length === 0 ? (
        <EmptyState title="No client users yet" description="Invite your first client to the portal."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>Invite Client</NewButton>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => {
            const st = STATUSES.find((s) => s.id === c.status)!;
            return (
              <div key={c.id} className="rounded-2xl border border-divider bg-card p-5 brand-shadow">
                <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-black text-primary">{initials(c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black">{c.name}</div>
                    <div className="truncate text-[11px]" style={{ color: "#999" }}>{c.email}</div>
                  </div>
                </div>
                <div className="mt-3 text-[12px]" style={{ color: "#666" }}>{c.companyName || "—"}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: st.color }}>{st.label}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="mt-2 text-[10px]" style={{ color: "#999" }}>Invited {formatDate(c.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
      <UserDialog open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(d) => { if (editing) update(editing.id, d); else add(d); setOpen(false); }} />
    </div>
  );
}

function UserDialog({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: ClientUser | null;
  onSave: (d: Omit<ClientUser, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<ClientUser, "id" | "createdAt">>({
    name: "", email: "", companyName: "", status: "invited",
  });
  useEffect(() => {
    if (open) {
      if (editing) { const { id: _i, createdAt: _c, ...r } = editing; setForm(r); }
      else setForm({ name: "", email: "", companyName: "", status: "invited" });
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Client User" : "Invite Client User"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Company</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ClientUserStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.name.trim() || !form.email.trim()) return; onSave(form); }} className="font-bold">
            {editing ? "Save" : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
