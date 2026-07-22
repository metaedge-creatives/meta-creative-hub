import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatCurrency, formatDate } from "@/lib/crm/hooks";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals · MetaEdge Creatives CRM" },
      { name: "description", content: "Pipeline board for all your deals." },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const can = useCan("deals");
  const deals = useCRM((s) => s.deals);
  const moveDealStage = useCRM((s) => s.moveDealStage);
  if (!can) return <NoAccess module="Deals" />;

  const totalOpen = deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((n, d) => n + d.value, 0);

  const onDrop = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveDealStage(id, stage);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle={`${deals.length} deals · ${formatCurrency(totalOpen)} open value`}
        actions={<NewDealDialog />}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {DEAL_STAGES.map((s) => {
          const stageDeals = deals.filter((d) => d.stage === s.id);
          const total = stageDeals.reduce((n, d) => n + d.value, 0);
          return (
            <div
              key={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, s.id)}
              className="flex min-h-[300px] flex-col rounded-xl border border-divider bg-card brand-shadow"
            >
              <div className="h-1 rounded-t-xl bg-primary" />
              <div className="flex items-center justify-between px-4 pt-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{s.label}</div>
                  <div className="text-xs" style={{ color: "#999" }}>{stageDeals.length} · {formatCurrency(total)}</div>
                </div>
              </div>
              <div className="flex-1 space-y-2 p-3">
                {stageDeals.map((d) => (
                  <Link
                    key={d.id}
                    to="/deals/$id"
                    params={{ id: d.id }}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                    className="block rounded-lg border border-divider bg-background p-3 hover:border-primary"
                  >
                    <div className="text-sm font-extrabold leading-tight">{d.title}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-primary">{formatCurrency(d.value)}</span>
                      <span style={{ color: "#999" }}>{formatDate(d.expectedClose)}</span>
                    </div>
                  </Link>
                ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-divider p-4 text-center text-[11px]" style={{ color: "#999" }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewDealDialog() {
  const [open, setOpen] = useState(false);
  const companies = useCRM((s) => s.companies);
  const contacts = useCRM((s) => s.contacts);
  const users = useCRM((s) => s.users);
  const addDeal = useCRM((s) => s.addDeal);
  const [form, setForm] = useState({
    title: "",
    value: "",
    stage: "lead" as DealStage,
    companyId: "",
    contactId: "",
    expectedClose: "",
    ownerId: "",
    notes: "",
  });
  const submit = () => {
    if (!form.title.trim()) return;
    addDeal({
      title: form.title.trim(),
      value: Number(form.value) || 0,
      stage: form.stage,
      companyId: form.companyId || undefined,
      contactId: form.contactId || undefined,
      expectedClose: form.expectedClose || undefined,
      ownerId: form.ownerId || undefined,
      notes: form.notes || undefined,
    });
    setForm({ title: "", value: "", stage: "lead", companyId: "", contactId: "", expectedClose: "", ownerId: "", notes: "" });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <NewButton>New Deal</NewButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value (USD)</Label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact</Label>
              <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Expected Close</Label>
              <Input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} />
            </div>
            <div>
              <Label>Owner</Label>
              <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="font-bold">Save deal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}