import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatCurrency, formatDate } from "@/lib/crm/hooks";
import { Input } from "@/components/ui/input";
import { CreditCard, Search } from "lucide-react";

export const Route = createFileRoute("/portal/payments")({
  head: () => ({ meta: [{ title: "Payments · Client Portal" }] }),
  component: PortalPayments,
});

const EMPTY: any[] = [];

function PortalPayments() {
  const client = useCurrentClientUser();
  const payments = useCRM((s) => s.lists["payments"]) ?? EMPTY;
  const [q, setQ] = useState("");

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return payments.filter((p: any) => {
      const n = (p.meta?.clientName || "").toLowerCase();
      return n === cn || (cc && n === cc);
    });
  }, [client, payments]);

  const filtered = mine.filter((p: any) => q === "" || p.name.toLowerCase().includes(q.toLowerCase()));
  const total = mine.reduce((s: number, p: any) => s + Number(p.meta?.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">Payments</div>
            <div className="text-xs" style={{ color: "#777" }}>Your payment history.</div>
          </div>
        </div>
        <div className="rounded-xl border border-divider bg-white px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#999" }}>Lifetime paid</div>
          <div className="text-xl font-black">{formatCurrency(total)}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payments" className="pl-9" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-divider bg-white">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: "#888" }}>No payments yet.</div>
        )}
        {filtered.map((p: any) => (
          <div key={p.id} className="flex flex-col gap-2 border-b border-divider p-4 text-sm last:border-b-0 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-black">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {p.meta?.date ? formatDate(p.meta.date) : ""} · {p.meta?.method} {p.meta?.reference ? `· Ref ${p.meta.reference}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{p.meta?.status || "completed"}</span>
              <div className="text-lg font-black">{formatCurrency(Number(p.meta?.amount || 0))}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
