import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatCurrency, formatDate } from "@/lib/crm/hooks";
import type { Invoice } from "@/lib/crm/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Search, Download, CreditCard } from "lucide-react";

export const Route = createFileRoute("/portal/invoices")({
  head: () => ({ meta: [{ title: "Invoices · Client Portal" }] }),
  component: PortalInvoices,
});

const EMPTY: Invoice[] = [];

function invoiceTotal(i: Invoice) {
  const sub = (i.items || []).reduce((a, li) => a + Number(li.quantity || 0) * Number(li.unitPrice || 0), 0);
  return sub * (1 + Number(i.taxRate || 0) / 100) - Number(i.discount || 0);
}

function PortalInvoices() {
  const client = useCurrentClientUser();
  const invoices = useCRM((s) => s.invoices) ?? EMPTY;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return invoices.filter(
      (i) => i.clientName.toLowerCase() === cn || (cc && i.clientName.toLowerCase() === cc),
    );
  }, [client, invoices]);

  const filtered = mine.filter(
    (i) =>
      (status === "all" || i.status === status) &&
      (q === "" || i.number.toLowerCase().includes(q.toLowerCase()) || i.clientName.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-5">
      <Header title="Invoices" subtitle="View and download your invoices." icon={FileText} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number" className="pl-9" />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-divider bg-white">
        <div className="hidden grid-cols-12 gap-3 border-b border-divider bg-muted/40 px-4 py-3 text-[10px] font-black uppercase tracking-wider md:grid" style={{ color: "#777" }}>
          <div className="col-span-3">Invoice</div>
          <div className="col-span-3">Issued</div>
          <div className="col-span-2">Due</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: "#888" }}>No invoices found.</div>
        )}
        {filtered.map((i) => (
          <div key={i.id} className="grid grid-cols-2 items-center gap-3 border-b border-divider p-4 text-sm last:border-b-0 md:grid-cols-12">
            <div className="col-span-2 md:col-span-3">
              <div className="font-black">{i.number}</div>
              <div className="text-[11px] text-muted-foreground">{(i.items || []).length} items</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-[10px] font-bold uppercase tracking-wider md:hidden" style={{ color: "#999" }}>Issued</div>
              {formatDate(i.issueDate)}
            </div>
            <div className="md:col-span-2">
              <div className="text-[10px] font-bold uppercase tracking-wider md:hidden" style={{ color: "#999" }}>Due</div>
              {i.dueDate ? formatDate(i.dueDate) : "—"}
            </div>
            <div className="md:col-span-2">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{i.status}</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-2">
              <div className="font-black">{formatCurrency(invoiceTotal(i))}</div>
              {i.status !== "paid" && i.status !== "cancelled" && (
                <Button size="sm" variant="outline" className="hidden md:inline-flex">
                  <CreditCard className="h-3.5 w-3.5" /> Pay
                </Button>
              )}
              <Button size="sm" variant="ghost">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-black tracking-tight">{title}</div>
        <div className="text-xs" style={{ color: "#777" }}>{subtitle}</div>
      </div>
    </div>
  );
}
