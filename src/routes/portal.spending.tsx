import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatCurrency } from "@/lib/crm/hooks";
import { PieChart } from "lucide-react";

export const Route = createFileRoute("/portal/spending")({
  head: () => ({ meta: [{ title: "Spending · Client Portal" }] }),
  component: PortalSpending,
});

const EMPTY: any[] = [];
const COLORS = ["#BF1833", "#8A0F24", "#E5647A", "#3A0710", "#F5A5B4", "#D63552", "#5C0713"];

function PortalSpending() {
  const client = useCurrentClientUser();
  const invoices = useCRM((s) => s.invoices) ?? EMPTY;
  const payments = useCRM((s) => s.lists["payments"]) ?? EMPTY;

  const data = useMemo(() => {
    if (!client) return { byMonth: [] as { m: string; v: number }[], byMethod: [] as { k: string; v: number }[], total: 0 };
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    const mine = payments.filter((p: any) => {
      const n = (p.meta?.clientName || "").toLowerCase();
      return n === cn || (cc && n === cc);
    });

    const byMonthMap = new Map<string, number>();
    const byMethodMap = new Map<string, number>();
    for (const p of mine) {
      const amt = Number(p.meta?.amount || 0);
      const d = new Date(p.meta?.date || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap.set(key, (byMonthMap.get(key) || 0) + amt);
      const m = p.meta?.method || "Other";
      byMethodMap.set(m, (byMethodMap.get(m) || 0) + amt);
    }
    const byMonth = Array.from(byMonthMap.entries()).sort().map(([m, v]) => ({ m, v }));
    const byMethod = Array.from(byMethodMap.entries()).map(([k, v]) => ({ k, v }));
    const total = mine.reduce((s: number, p: any) => s + Number(p.meta?.amount || 0), 0);
    return { byMonth, byMethod, total };
  }, [client, invoices, payments]);

  const maxMonth = Math.max(1, ...data.byMonth.map((x) => x.v));
  const totalMethod = data.byMethod.reduce((s, x) => s + x.v, 0) || 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <PieChart className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Spending</div>
          <div className="text-xs" style={{ color: "#777" }}>Insights into your spending with MetaEdge.</div>
        </div>
      </div>

      <div className="rounded-2xl border border-divider bg-white p-5">
        <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#999" }}>Total spent</div>
        <div className="mt-1 text-4xl font-black">{formatCurrency(data.total)}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-divider bg-white p-5">
          <div className="mb-3 text-sm font-black">By month</div>
          {data.byMonth.length === 0 ? (
            <div className="rounded-lg border border-dashed border-divider p-6 text-center text-xs" style={{ color: "#888" }}>No data</div>
          ) : (
            <div className="space-y-2">
              {data.byMonth.map((row) => (
                <div key={row.m} className="flex items-center gap-3">
                  <div className="w-16 text-[11px] font-bold" style={{ color: "#666" }}>{row.m}</div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(row.v / maxMonth) * 100}%` }} />
                  </div>
                  <div className="w-24 text-right text-xs font-black">{formatCurrency(row.v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-divider bg-white p-5">
          <div className="mb-3 text-sm font-black">By payment method</div>
          {data.byMethod.length === 0 ? (
            <div className="rounded-lg border border-dashed border-divider p-6 text-center text-xs" style={{ color: "#888" }}>No data</div>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {data.byMethod.map((seg, i) => (
                  <div key={seg.k} style={{ width: `${(seg.v / totalMethod) * 100}%`, background: COLORS[i % COLORS.length] }} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {data.byMethod.map((seg, i) => (
                  <div key={seg.k} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="min-w-0 flex-1 truncate font-bold">{seg.k}</span>
                    <span className="text-muted-foreground">{formatCurrency(seg.v)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
