import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Ticket, Plus, Search, Trash2, Send, Paperclip } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentUser, formatDate } from "@/lib/crm/hooks";
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
import type { ListItem } from "@/lib/crm/types"
const EMPTY_LIST: any[] = [];;

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Tickets · MetaEdge CRM" }] }),
  component: TicketsPage,
});

type Priority = "low" | "normal" | "high" | "urgent";
type TStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
type Message = { id: string; authorId: string; authorName: string; body: string; at: string; attachments?: string[] };
type TMeta = {
  subject?: string;
  client?: string;
  clientEmail?: string;
  departmentId?: string;
  priority?: Priority;
  status?: TStatus;
  description?: string;
  messages?: Message[];
  attachments?: string[];
};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const STATUSES: TStatus[] = ["open", "in_progress", "waiting", "resolved", "closed"];
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

function TicketsPage() {
  const items = useCRM((s) => s.lists["support_tickets"] ?? EMPTY_LIST);
  const depts = useCRM((s) => s.lists["ticket_departments"] ?? EMPTY_LIST);
  const add = useCRM((s) => s.addListItem);
  const del = useCRM((s) => s.deleteListItem);
  const update = useCRM((s) => s.updateListItem);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [deptF, setDeptF] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ListItem | null>(null);
  const [manageDepts, setManageDepts] = useState(false);
  const [form, setForm] = useState<TMeta & { subject: string }>({ subject: "", priority: "normal", status: "open" });

  const filtered = useMemo(() => items.filter((i) => {
    const m = (i.meta ?? {}) as TMeta;
    const s = q.toLowerCase();
    if (s && !i.name.toLowerCase().includes(s) && !(m.client ?? "").toLowerCase().includes(s)) return false;
    if (statusF !== "all" && (m.status ?? "open") !== statusF) return false;
    if (deptF !== "all" && (m.departmentId ?? "") !== deptF) return false;
    return true;
  }), [items, q, statusF, deptF]);

  const stats = useMemo(() => {
    const by = (st: TStatus) => items.filter((i) => ((i.meta as TMeta)?.status ?? "open") === st).length;
    return { total: items.length, open: by("open"), in_progress: by("in_progress"), resolved: by("resolved") };
  }, [items]);

  const create = () => {
    if (!form.subject.trim()) { alert("Subject required"); return; }
    add("support_tickets", {
      name: form.subject.trim(),
      meta: { ...form, messages: form.description ? [{ id: uid(), authorId: "system", authorName: form.client ?? "Client", body: form.description, at: new Date().toISOString() }] : [] } as TMeta,
    });
    setForm({ subject: "", priority: "normal", status: "open" });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={`${stats.open} open · ${stats.in_progress} in progress`}
        actions={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setManageDepts(true)}>Departments</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><NewButton>New Ticket</NewButton></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Open a support ticket</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Client Name</Label><Input value={form.client ?? ""} onChange={(e) => setForm({ ...form, client: e.target.value })} /></div>
                  <div><Label>Client Email</Label><Input type="email" value={form.clientEmail ?? ""} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Department</Label>
                    <Select value={form.departmentId ?? ""} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div><Label>Priority</Label>
                    <Select value={form.priority ?? "normal"} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div><Label>Status</Label>
                    <Select value={form.status ?? "open"} onValueChange={(v) => setForm({ ...form, status: v as TStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select></div>
                </div>
                <div><Label>Message</Label>
                  <textarea rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} className="font-bold">Create ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total", stats.total], ["Open", stats.open], ["In Progress", stats.in_progress], ["Resolved", stats.resolved]].map(([l, v]) => (
          <div key={String(l)} className="rounded-md border border-divider bg-card p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#999" }}>{l}</div>
            <div className="mt-1 text-lg font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#999" }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject or client…" className="pl-9" />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={deptF} onValueChange={setDeptF}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All departments</SelectItem>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tickets" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-divider bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-[10px] font-bold uppercase" style={{ color: "#666" }}>
              <tr><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Dept</th><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th><th className="px-3 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const m = (i.meta ?? {}) as TMeta;
                const dept = depts.find((d) => d.id === m.departmentId);
                return (
                  <tr key={i.id} className="border-t border-divider hover:bg-muted/20 cursor-pointer" onClick={() => setDetail(i)}>
                    <td className="px-3 py-2 font-semibold">{i.name}</td>
                    <td className="px-3 py-2">{m.client ?? "—"}</td>
                    <td className="px-3 py-2">{dept?.name ?? "—"}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.priority === "urgent" ? "bg-red-100 text-red-700" : m.priority === "high" ? "bg-orange-100 text-orange-700" : m.priority === "low" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>{m.priority ?? "normal"}</span></td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "resolved" || m.status === "closed" ? "bg-emerald-100 text-emerald-700" : m.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{(m.status ?? "open").replace("_", " ")}</span></td>
                    <td className="px-3 py-2 text-xs">{formatDate(i.meta?.createdAt as string) || "—"}</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); if (confirm("Delete ticket?")) del("support_tickets", i.id); }}><Trash2 className="h-3 w-3" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && <TicketDetail item={detail} depts={depts} onClose={() => setDetail(null)} onSave={(p) => update("support_tickets", detail.id, p)} />}
      {manageDepts && <DepartmentsDialog onClose={() => setManageDepts(false)} />}
    </div>
  );
}

function TicketDetail({ item, depts, onClose, onSave }: { item: ListItem; depts: ListItem[]; onClose: () => void; onSave: (p: Partial<ListItem>) => void }) {
  const user = useCurrentUser();
  const [m, setM] = useState<TMeta>((item.meta ?? {}) as TMeta);
  const [reply, setReply] = useState("");
  const patch = (p: Partial<TMeta>) => { const next = { ...m, ...p }; setM(next); onSave({ meta: next }); };

  const sendReply = () => {
    if (!reply.trim()) return;
    const msg: Message = { id: uid(), authorId: user?.id ?? "agent", authorName: user?.name ?? "Agent", body: reply.trim(), at: new Date().toISOString() };
    patch({ messages: [...(m.messages ?? []), msg] });
    setReply("");
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item.name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Department</Label>
            <Select value={m.departmentId ?? ""} onValueChange={(v) => patch({ departmentId: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Priority</Label>
            <Select value={m.priority ?? "normal"} onValueChange={(v) => patch({ priority: v as Priority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Status</Label>
            <Select value={m.status ?? "open"} onValueChange={(v) => patch({ status: v as TStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select></div>
        </div>

        <div className="mt-4 rounded-md border border-divider bg-muted/20 p-3 text-xs" style={{ color: "#666" }}>
          Client: {m.client ?? "—"} · {m.clientEmail ?? "no email"}
        </div>

        <div className="mt-4 space-y-3">
          <Label>Conversation</Label>
          <div className="max-h-72 overflow-y-auto rounded-md border border-divider bg-card p-3 space-y-3">
            {(m.messages ?? []).length === 0 && <div className="text-sm" style={{ color: "#999" }}>No messages yet.</div>}
            {(m.messages ?? []).map((msg) => (
              <div key={msg.id} className="rounded-md bg-muted/30 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{msg.authorName} · {formatDate(msg.at)}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{msg.body}</div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2">
            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <Button onClick={sendReply} className="font-bold"><Send className="mr-1 h-4 w-4" />Reply</Button>
          </div>
        </div>

        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepartmentsDialog({ onClose }: { onClose: () => void }) {
  const items = useCRM((s) => s.lists["ticket_departments"] ?? EMPTY_LIST);
  const add = useCRM((s) => s.addListItem);
  const del = useCRM((s) => s.deleteListItem);
  const [name, setName] = useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Departments</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales, Support" />
          <Button onClick={() => { if (name.trim()) { add("ticket_departments", { name: name.trim() }); setName(""); } }}><Plus className="h-4 w-4" /></Button>
        </div>
        <ul className="mt-2 space-y-1">
          {items.length === 0 && <li className="text-sm" style={{ color: "#999" }}>No departments yet.</li>}
          {items.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border border-divider bg-card px-3 py-2 text-sm">
              <span>{d.name}</span>
              <Button size="sm" variant="ghost" onClick={() => del("ticket_departments", d.id)}><Trash2 className="h-3 w-3" /></Button>
            </li>
          ))}
        </ul>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
