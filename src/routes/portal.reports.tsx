import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatDate } from "@/lib/crm/hooks";
import { BarChart3, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/portal/reports")({
  head: () => ({ meta: [{ title: "Reports · Client Portal" }] }),
  component: PortalReports,
});

function PortalReports() {
  const client = useCurrentClientUser();
  const reports = useCRM((s) => s.clientReports);
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<"all" | "weekly" | "monthly" | "custom">("all");

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return reports.filter((r) => {
      const n = r.clientName.toLowerCase();
      return n === cn || (!!cc && n === cc);
    });
  }, [client, reports]);

  const filtered = mine.filter(
    (r) =>
      (period === "all" || r.period === period) &&
      (q === "" || r.title.toLowerCase().includes(q.toLowerCase()) || r.summary.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Reports</div>
          <div className="text-xs" style={{ color: "#777" }}>Weekly and monthly updates from the team.</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports" className="pl-9" />
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All periods</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-10 text-center text-sm" style={{ color: "#888" }}>
          <BarChart3 className="mx-auto mb-3 h-6 w-6 text-primary" />
          No reports yet. Your account team will publish updates here.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article key={r.id} className="rounded-2xl border border-divider bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Calendar className="h-3.5 w-3.5" /> {r.period}
                    <span className="text-muted-foreground">· {formatDate(r.sentAt || r.createdAt)}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-black">{r.title}</h3>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm" style={{ color: "#444" }}>{r.summary}</p>
              {r.metrics && r.metrics.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {r.metrics.map((m, i) => (
                    <div key={i} className="rounded-lg border border-divider bg-muted/30 p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#888" }}>{m.label}</div>
                      <div className="mt-0.5 text-sm font-black">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
