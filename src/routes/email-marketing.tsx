import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import type { EmailCampaign, CampaignStatus } from "@/lib/crm/types";
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
import { Trash2, Edit, Send, Mail } from "lucide-react";

const STATUSES: { id: CampaignStatus; label: string; color: string }[] = [
  { id: "draft", label: "Draft", color: "#94A3B8" },
  { id: "scheduled", label: "Scheduled", color: "#F59E0B" },
  { id: "sent", label: "Sent", color: "#10B981" },
];

export const Route = createFileRoute("/email-marketing")({
  head: () => ({ meta: [{ title: "Email Marketing · MetaEdge CRM" }] }),
  component: EmailMarketingPage,
});

function EmailMarketingPage() {
  const can = useCan("emailMarketing");
  const items = useCRM((s) => s.campaigns);
  const emailConfig = useCRM((s) => s.emailConfig);
  const add = useCRM((s) => s.addCampaign);
  const update = useCRM((s) => s.updateCampaign);
  const setStatus = useCRM((s) => s.setCampaignStatus);
  const del = useCRM((s) => s.deleteCampaign);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  if (!can) return <NoAccess module="Email Marketing" />;

  const sendNow = (c: EmailCampaign) => {
    if (emailConfig.provider === "none" || !emailConfig.apiKey) {
      alert("Configure Email API in Settings to send campaigns.");
      return;
    }
    setStatus(c.id, "sent");
    alert(`Campaign "${c.name}" sent to ${c.audience} via ${emailConfig.provider.toUpperCase()} (simulated).`);
  };

  return (
    <div>
      <PageHeader title="Email Marketing" subtitle="Segmented campaigns, broadcasts and drips."
        actions={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Campaign</NewButton>} />
      {emailConfig.provider === "none" && (
        <div className="mb-4 rounded-lg border border-primary/25 bg-accent p-3 text-xs font-semibold text-primary">
          <Mail className="mr-2 inline h-3.5 w-3.5" /> Configure an Email API in Settings → Email API to enable real sending.
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Draft your first broadcast."
          action={<NewButton onClick={() => { setEditing(null); setOpen(true); }}>New Campaign</NewButton>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((c) => {
            const st = STATUSES.find((s) => s.id === c.status)!;
            return (
              <div key={c.id} className="rounded-2xl border border-divider bg-card p-5 brand-shadow">
                <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-black">{c.name}</div>
                    <div className="text-[11px]" style={{ color: "#999" }}>Subject: {c.subject}</div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: st.color }}>{st.label}</span>
                </div>
                <div className="mt-3 text-[12px]" style={{ color: "#666" }}>Audience: <span className="font-bold text-foreground">{c.audience}</span></div>
                {c.scheduledAt && <div className="mt-1 text-[11px]" style={{ color: "#999" }}>Scheduled: {formatDate(c.scheduledAt)}</div>}
                <div className="mt-4 flex justify-between">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete?")) del(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  {c.status !== "sent" && (
                    <Button size="sm" onClick={() => sendNow(c)} className="font-bold"><Send className="h-3.5 w-3.5" /> Send now</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CampaignDialog open={open} onClose={() => setOpen(false)} editing={editing}
        onSave={(d) => { if (editing) update(editing.id, d); else add(d); setOpen(false); }} />
    </div>
  );
}

function CampaignDialog({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: EmailCampaign | null;
  onSave: (d: Omit<EmailCampaign, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<EmailCampaign, "id" | "createdAt">>({
    name: "", subject: "", audience: "All contacts", status: "draft", scheduledAt: "", body: "",
  });
  useEffect(() => {
    if (open) {
      if (editing) { const { id: _i, createdAt: _c, ...r } = editing; setForm(r); }
      else setForm({ name: "", subject: "", audience: "All contacts", status: "draft", scheduledAt: "", body: "" });
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Campaign name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Subject line *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Audience</Label><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CampaignStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Scheduled at</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
          <div><Label>Body</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your email…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.name.trim() || !form.subject.trim()) return; onSave(form); }} className="font-bold">
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
