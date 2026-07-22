import { createFileRoute } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { formatCurrency } from "@/lib/crm/hooks";
import { PageHeader } from "@/components/crm/PageHeader";
import { DEAL_STAGES } from "@/lib/crm/types";
import { BarChart3, TrendingUp, Users, Handshake } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · MetaEdge CRM" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const deals = useCRM((s) => s.deals);
  const contacts = useCRM((s) => s.contacts);
  const projects = useCRM((s) => s.projects);
  const tasks = useCRM((s) => s.tasks);

  const pipelineValue = deals.reduce((a, d) => a + (d.value || 0), 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((a, d) => a + d.value, 0);

  const stats = [
    { label: "Pipeline value", value: formatCurrency(pipelineValue), icon: TrendingUp },
    { label: "Closed won", value: formatCurrency(wonValue), icon: Handshake },
    { label: "Contacts", value: contacts.length, icon: Users },
    { label: "Active projects", value: projects.length, icon: BarChart3 },
  ];

  const byStage = DEAL_STAGES.map((s) => ({
    ...s,
    count: deals.filter((d) => d.stage === s.id).length,
    value: deals.filter((d) => d.stage === s.id).reduce((a, d) => a + d.value, 0),
  }));
  const max = Math.max(1, ...byStage.map((s) => s.value));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Live snapshot of the numbers that matter this month." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl border border-divider bg-card p-5 brand-shadow">
            <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#999" }}>
                {s.label}
              </div>
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
                <span style={{ color: "#666" }}>
                  {s.count} · {formatCurrency(s.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(s.value / max) * 100}%` }}
                />
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
    </div>
  );
}