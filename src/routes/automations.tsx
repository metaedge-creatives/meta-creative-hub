import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Zap, Search } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { PageHeader } from "@/components/crm/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/automations")({
  head: () => ({
    meta: [
      { title: "Automations — MetaEdge Creatives CRM" },
      { name: "description", content: "Enable and manage automated workflows across your CRM." },
      { property: "og:title", content: "Automations — MetaEdge Creatives CRM" },
      { property: "og:description", content: "Toggle useful automations across clients, projects, invoices, leads, and more." },
    ],
  }),
  component: AutomationsPage,
});

type Automation = {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultOn?: boolean;
};

const AUTOMATIONS: Automation[] = [
  // Clients
  { id: "client.welcomeEmail", category: "Clients", name: "Send welcome email to new clients", description: "When a new client is created, automatically send the welcome email template.", defaultOn: true },
  { id: "client.assignOwner", category: "Clients", name: "Auto-assign new clients to owner", description: "Newly created clients are assigned to the creating user by default.", defaultOn: true },
  { id: "client.birthdayEmail", category: "Clients", name: "Send birthday greetings", description: "Automatically email clients on their birthday if a date is on file." },
  { id: "client.inactiveAlert", category: "Clients", name: "Alert on inactive clients (30 days)", description: "Notify the owner when a client has no activity for 30 days." },

  // Leads
  { id: "lead.autoScore", category: "Leads", name: "Auto-score new leads", description: "Score leads on creation based on source, category, and value.", defaultOn: true },
  { id: "lead.followupReminder", category: "Leads", name: "Follow-up reminder after 3 days", description: "Create a task to follow up if a lead has no activity in 3 days.", defaultOn: true },
  { id: "lead.convertOnWon", category: "Leads", name: "Convert lead to client on Won", description: "When a lead is marked Won, convert it into a client automatically.", defaultOn: true },
  { id: "lead.notifyOnNew", category: "Leads", name: "Notify team on new lead", description: "Send an in-app notification to sales when a new lead comes in.", defaultOn: true },
  { id: "lead.webFormAutoresponder", category: "Leads", name: "Web form auto-responder", description: "Reply to web form submissions with a thank-you email." },

  // Projects
  { id: "project.notifyStatusChange", category: "Projects", name: "Notify team on status change", description: "Send a notification when a project status changes.", defaultOn: true },
  { id: "project.deadlineReminder", category: "Projects", name: "Deadline reminder (24h before)", description: "Notify assigned users 24 hours before a project deadline.", defaultOn: true },
  { id: "project.autoInvoiceOnComplete", category: "Projects", name: "Auto-generate invoice on completion", description: "Create a draft invoice when a project is marked complete." },
  { id: "project.milestoneClientEmail", category: "Projects", name: "Email client on milestone completion", description: "Send an update email when a milestone is marked done.", defaultOn: true },

  // Tasks
  { id: "task.dueReminder", category: "Tasks", name: "Send task due-date reminders", description: "Remind assignees a configurable number of hours before due.", defaultOn: true },
  { id: "task.notifyOnAssign", category: "Tasks", name: "Notify user on task assignment", description: "Send an in-app notification when a task is assigned.", defaultOn: true },
  { id: "task.autoCloseCompletedProjects", category: "Tasks", name: "Auto-close tasks in completed projects", description: "Mark open tasks completed when their project is closed." },
  { id: "task.overdueEscalation", category: "Tasks", name: "Escalate overdue tasks", description: "Notify the project manager when a task is overdue by 2 days." },

  // Invoices
  { id: "invoice.dueReminder", category: "Invoices", name: "Send invoice due reminders", description: "Email clients 3 days before an invoice is due.", defaultOn: true },
  { id: "invoice.overdueReminder", category: "Invoices", name: "Send overdue reminders", description: "Follow up on overdue invoices every 7 days.", defaultOn: true },
  { id: "invoice.paymentReceipt", category: "Invoices", name: "Email receipt on payment", description: "Send a payment receipt automatically when a payment is recorded.", defaultOn: true },
  { id: "invoice.recurringGenerate", category: "Invoices", name: "Auto-generate recurring invoices", description: "Create invoices on schedule from active subscriptions.", defaultOn: true },
  { id: "invoice.lateFee", category: "Invoices", name: "Apply late fee on overdue", description: "Add a configurable late fee to invoices overdue by 14 days." },

  // Estimates
  { id: "estimate.expiryReminder", category: "Estimates", name: "Estimate expiry reminder", description: "Notify the owner 3 days before an estimate expires.", defaultOn: true },
  { id: "estimate.convertOnAccept", category: "Estimates", name: "Auto-convert accepted estimates to invoices", description: "Create an invoice automatically when an estimate is accepted.", defaultOn: true },
  { id: "estimate.followup", category: "Estimates", name: "Follow up on sent estimates", description: "Send a follow-up email 5 days after an estimate is sent." },

  // Support / Tickets
  { id: "ticket.autoAssign", category: "Support", name: "Auto-assign tickets by department", description: "Route new tickets to the department's default agent.", defaultOn: true },
  { id: "ticket.acknowledge", category: "Support", name: "Auto-acknowledge new tickets", description: "Send an auto-reply confirming a ticket was received.", defaultOn: true },
  { id: "ticket.slaBreach", category: "Support", name: "SLA breach alert", description: "Notify managers when a ticket exceeds SLA response time." },
  { id: "ticket.closeInactive", category: "Support", name: "Auto-close inactive tickets", description: "Close tickets marked resolved with no reply for 7 days." },

  // Contracts / Proposals
  { id: "contract.renewalReminder", category: "Contracts", name: "Contract renewal reminder", description: "Alert 30 days before a contract end date.", defaultOn: true },
  { id: "proposal.followup", category: "Proposals", name: "Follow up on sent proposals", description: "Email a follow-up 4 days after a proposal is sent." },

  // Subscriptions
  { id: "subscription.renewal", category: "Subscriptions", name: "Charge subscription on renewal", description: "Automatically charge the client when a subscription renews.", defaultOn: true },
  { id: "subscription.failedRetry", category: "Subscriptions", name: "Retry failed subscription charges", description: "Retry a failed subscription charge after 24h." },

  // System
  { id: "system.dailyDigest", category: "System", name: "Daily activity digest", description: "Send each user a daily summary email of activity." },
  { id: "system.backupWeekly", category: "System", name: "Weekly data snapshot", description: "Take a weekly backup snapshot of your CRM data.", defaultOn: true },
];

const CATEGORIES = ["All", ...Array.from(new Set(AUTOMATIONS.map((a) => a.category)))];

function AutomationsPage() {
  const moduleSettings = useCRM((s) => s.moduleSettings);
  const setSetting = useCRM((s) => s.setSetting);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const values = (moduleSettings?.automations ?? {}) as Record<string, boolean>;

  const isOn = (a: Automation) => {
    const v = values?.[a.id];
    return typeof v === "boolean" ? v : !!a.defaultOn;
  };

  const filtered = useMemo(() => {
    return AUTOMATIONS.filter((a) => {
      if (cat !== "All" && a.category !== cat) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    });
  }, [query, cat]);

  const enabledCount = AUTOMATIONS.filter(isOn).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="inline-flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> Automations</span>}
        subtitle="Toggle useful workflows to run automatically across your CRM."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total automations" value={AUTOMATIONS.length} />
        <StatCard label="Enabled" value={enabledCount} accent />
        <StatCard label="Categories" value={CATEGORIES.length - 1} />
      </div>

      <div className="widget-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search automations…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                cat === c
                  ? "bg-primary text-white"
                  : "bg-secondary/60 text-primary hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((a) => {
          const on = isOn(a);
          return (
            <div key={a.id} className="widget-card p-4 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-black text-[14px]" style={{ color: "#2A1418" }}>{a.name}</div>
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-widest">{a.category}</Badge>
                </div>
                <p className="mt-1 text-xs" style={{ color: "#7A6870" }}>{a.description}</p>
              </div>
              <Switch
                checked={on}
                onCheckedChange={(v) => setSetting("automations", a.id, v)}
                aria-label={`Toggle ${a.name}`}
              />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="widget-card p-8 text-center text-sm md:col-span-2" style={{ color: "#7A6870" }}>
            No automations match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="widget-card p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">{label}</div>
      <div className={`mt-1 text-2xl font-black ${accent ? "text-primary" : ""}`} style={accent ? {} : { color: "#2A1418" }}>
        {value}
      </div>
    </div>
  );
}
