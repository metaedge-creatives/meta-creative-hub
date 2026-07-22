import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { formatCurrency, formatDate } from "@/lib/crm/hooks";
import { PageHeader } from "@/components/crm/PageHeader";
import { DEAL_STAGES } from "@/lib/crm/types";
import type { ClientReportPeriod } from "@/lib/crm/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, TrendingUp, Users, Handshake, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · MetaEdge CRM" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const deals = useCRM((s) => s.deals);
  const contacts = useCRM((s) => s.contacts);
  const projects = useCRM((s) => s.projects);
  const tasks = useCRM((s) => s.tasks);
  const clientUsers = useCRM((s) => s.clientUsers);
  const clientReports = useCRM((s) => s.clientReports);
  const addClientReport = useCRM((s) => s.addClientReport);
  const deleteClientReport = useCRM((s) => s.deleteClientReport);

  const [sendOpen, setSendOpen] = useState(false);
  const [form, setForm] = useState<{ clientName: string; period: ClientReportPeriod; title: string; summary: string }>({
    clientName: "",
    period: "weekly",
    title: "",
    summary: "",
  });

  const pipelineValue = deals.reduce((a, d) => a + (d.value || 0), 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((a, d) => a + d.value, 0);

  const stats = [
    { label: "Pipeline value", value: formatCurrency(pipelineValue), icon: TrendingUp },
    { label: "Closed won", value: formatCurrency(wonValue), icon: Handshake },
    { label: "Contacts", value: contacts.length, icon: Users },
    { label: "Active projects", value: projects.length, icon: BarChart3 },
  ];

  const byStage = useMemo(
    () => DEAL_STAGES.map((s) => ({
      ...s,
      count: deals.filter((d) => d.stage === s.id).length,
      value: deals.filter((d) => d.stage === s.id).reduce((a, d) => a + d.value, 0),
    })),
    [deals],
  );
  const max = Math.max(1, ...byStage.map((s) => s.value));

  const submitReport = () => {
    if (!form.clientName || !form.title || !form.summary) return;
    addClientReport({
      clientName: form.clientName,
      period: form.period,
      title: form.title,
      summary: form.summary,
      sentAt: new Date().toISOString(),
    });
    setForm({ clientName: "", period: "weekly", title: "", summary: "" });
    setSendOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Live snapshot of the numbers that matter this month."
        actions={
          <Button onClick={() => setSendOpen(true)} className="font-bold">
            <Send className="h-4 w-4" /> Send report to client
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border border-divider bg-card p-5 brand-shadow">
            <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#999" }}>{s.label}</div>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Pipeline</div>
            <div className="text-lg font-extrabold">Deal value by stage</div>
          </div>
          <div className="text-xs" style={{ color: "#666" }}>Total {formatCurrency(pipelineValue)}</div>
        </div>
        <div className="space-y-3">
          {byStage.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-semibold">{s.label}</span>
                <span style={{ color: "#666" }}>{s.count} · {formatCurrency(s.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(s.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Tasks</div>
          <div className="mt-2 text-3xl font-black">
            {tasks.filter((t) => t.done).length}
            <span className="text-lg font-bold text-muted-foreground"> / {tasks.length}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "#666" }}>Completed vs total</p>
        </div>
        <div className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Projects</div>
          <div className="mt-2 text-3xl font-black">{projects.length}</div>
          <p className="mt-1 text-xs" style={{ color: "#666" }}>Deep-dive dashboards land with the full Reports module.</p>
        </div>
      </div>

      {/* Client reports library */}
      <div className="rounded-2xl border border-divider bg-card p-6 brand-shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Client Reports</div>
            <div className="text-lg font-extrabold">Sent to clients</div>
          </div>
          <div className="text-xs" style={{ color: "#666" }}>{clientReports.length} report{clientReports.length === 1 ? "" : "s"}</div>
        </div>
        {clientReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-divider p-6 text-center text-sm" style={{ color: "#888" }}>
            No client reports sent yet. Use "Send report to client" above.
          </div>
        ) : (
          <div className="space-y-2">
            {clientReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-divider p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black">{r.title}</div>
                  <div className="truncate text-[11px]" style={{ color: "#888" }}>
                    {r.clientName} · {r.period} · {formatDate(r.sentAt || r.createdAt)}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this report?")) deleteClientReport(r.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send report to client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Client</Label>
              <Select value={form.clientName} onValueChange={(v) => setForm({ ...form, clientName: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
                <SelectContent>
                  {clientUsers.map((c) => (
                    <SelectItem key={c.id} value={c.companyName || c.name}>{c.companyName || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as ClientReportPeriod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Weekly update — Sept 2" /></div>
            <div><Label>Summary *</Label><Textarea rows={6} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What we shipped, what's next…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} disabled={!form.clientName || !form.title || !form.summary}>
              <Send className="h-4 w-4" /> Send to portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
