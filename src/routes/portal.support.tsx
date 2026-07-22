import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatDate } from "@/lib/crm/hooks";
import type { SupportTicket, TicketPriority } from "@/lib/crm/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Plus, MessageSquare, X } from "lucide-react";

export const Route = createFileRoute("/portal/support")({
  head: () => ({ meta: [{ title: "Support · Client Portal" }] }),
  component: PortalSupport,
});

const EMPTY: SupportTicket[] = [];

function PortalSupport() {
  const client = useCurrentClientUser();
  const tickets = useCRM((s) => s.tickets) ?? EMPTY;
  const addTicket = useCRM((s) => s.addTicket);
  const addTicketMessage = useCRM((s) => (s as any).addTicketMessage);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SupportTicket | null>(null);

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return tickets.filter(
      (t) => t.clientName.toLowerCase() === cn || (cc && t.clientName.toLowerCase() === cc),
    );
  }, [client, tickets]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">Support</div>
            <div className="text-xs" style={{ color: "#777" }}>We're here to help. Open a ticket any time.</div>
          </div>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New ticket</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {mine.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-divider p-8 text-center text-sm" style={{ color: "#888" }}>
            No support tickets yet.
          </div>
        )}
        {mine.map((t) => (
          <button
            key={t.id}
            onClick={() => setDetail(t)}
            className="rounded-2xl border border-divider bg-white p-5 text-left transition hover:border-primary"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{t.subject}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Opened {formatDate(t.createdAt)}</div>
              </div>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{t.status}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: "#777" }}>
              <span>Priority: <b className="uppercase">{t.priority}</b></span>
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> View thread</span>
            </div>
          </button>
        ))}
      </div>

      {open && client && (
        <NewTicket
          onClose={() => setOpen(false)}
          onSubmit={(v) => {
            addTicket({
              subject: v.subject,
              clientName: client.companyName || client.name,
              clientEmail: client.email,
              priority: v.priority,
              status: "open",
              description: v.description,
            } as any);
            setOpen(false);
          }}
        />
      )}

      {detail && (
        <TicketDetail
          ticket={detail}
          onClose={() => setDetail(null)}
          onReply={(msg) => {
            if (addTicketMessage) addTicketMessage(detail.id, { authorName: client?.name || "Client", body: msg, fromClient: true });
          }}
        />
      )}
    </div>
  );
}

function NewTicket({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: { subject: string; priority: TicketPriority; description: string }) => void }) {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-divider bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-black">New support ticket</div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What can we help with?" />
          </div>
          <div>
            <Label>Priority</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!subject.trim()} onClick={() => onSubmit({ subject, priority, description })}>Submit ticket</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ ticket, onClose, onReply }: { ticket: SupportTicket; onClose: () => void; onReply: (msg: string) => void }) {
  const [msg, setMsg] = useState("");
  const messages = (ticket as any).messages ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-divider bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black">{ticket.subject}</div>
            <div className="text-[11px] text-muted-foreground">Ticket · Opened {formatDate(ticket.createdAt)}</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {(ticket as any).description && (
          <div className="mb-4 rounded-lg border border-divider bg-muted/40 p-3 text-sm">{(ticket as any).description}</div>
        )}

        <div className="space-y-2">
          {messages.map((m: any) => (
            <div key={m.id} className={`rounded-lg border border-divider p-3 text-sm ${m.fromClient ? "bg-accent/40" : "bg-white"}`}>
              <div className="mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: "#888" }}>
                {m.authorName} · {formatDate(m.at)}
              </div>
              {m.body}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-divider p-4 text-center text-xs" style={{ color: "#888" }}>No replies yet.</div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Label>Add a reply</Label>
          <Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type your message…" />
          <div className="flex justify-end">
            <Button disabled={!msg.trim() || !onReply} onClick={() => { onReply(msg); setMsg(""); }}>Send reply</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
