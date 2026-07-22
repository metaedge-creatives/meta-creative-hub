import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { formatCurrency, formatDate } from "@/lib/crm/hooks";
import { FileText, ScrollText, CreditCard, LifeBuoy, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "Dashboard · Client Portal" }] }),
  component: PortalDashboard,
});

const EMPTY: any[] = [];

function matchClient(name: string, clientName: string, clientCompany?: string) {
  const n = name.toLowerCase();
  if (n === clientName.toLowerCase()) return true;
  if (clientCompany && n === clientCompany.toLowerCase()) return true;
  return false;
}

function PortalDashboard() {
  const client = useCurrentClientUser();
  const invoices = useCRM((s) => s.invoices) ?? EMPTY;
  const contracts = useCRM((s) => s.contracts) ?? EMPTY;
  const tickets = useCRM((s) => s.tickets) ?? EMPTY;
  const paymentsList = useCRM((s) => s.lists["payments"]) ?? EMPTY;

  const my = useMemo(() => {
    if (!client) return { inv: [], con: [], tix: [], pay: [] as any[] };
    const cn = client.name;
    const cc = client.companyName;
    return {
      inv: invoices.filter((i: any) => matchClient(i.clientName, cn, cc)),
      con: contracts.filter((c: any) => matchClient(c.clientName, cn, cc)),
      tix: tickets.filter((t: any) => matchClient(t.clientName, cn, cc)),
      pay: paymentsList.filter((p: any) => matchClient(p.meta?.clientName ?? "", cn, cc)),
    };
  }, [client, invoices, contracts, tickets, paymentsList]);

  const outstanding = my.inv
    .filter((i: any) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s: number, i: any) => {
      const sub = (i.items || []).reduce((a: number, li: any) => a + Number(li.quantity || 0) * Number(li.unitPrice || 0), 0);
      const withTax = sub * (1 + Number(i.taxRate || 0) / 100);
      const afterDisc = withTax - Number(i.discount || 0);
      return s + afterDisc;
    }, 0);

  const totalPaid = my.pay
    .filter((p: any) => (p.meta?.status || "completed") === "completed")
    .reduce((s: number, p: any) => s + Number(p.meta?.amount || 0), 0);

  const openTickets = my.tix.filter((t: any) => t.status !== "closed" && t.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-divider bg-gradient-to-br from-primary to-[#8A0F24] p-6 text-white md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> Client dashboard
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Hi {client?.name?.split(" ")[0] || "there"}, welcome back 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              Here's a snapshot of your account with MetaEdge Creatives.
            </p>
          </div>
          <Link
            to="/portal/support"
            className="group relative inline-flex shrink-0 items-center gap-3 self-start rounded-2xl bg-white px-6 py-4 text-primary shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/70">
                New
              </span>
              <span className="text-lg font-black tracking-tight text-neutral-900">
                Start a request
              </span>
            </span>
            <ArrowRight className="ml-2 h-5 w-5 text-primary transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Outstanding" value={formatCurrency(outstanding)} sub={`${my.inv.length} invoices`} />
        <Kpi label="Total paid" value={formatCurrency(totalPaid)} sub={`${my.pay.length} payments`} />
        <Kpi label="Contracts" value={String(my.con.length)} sub={`${my.con.filter((c: any) => c.status === "signed").length} signed`} />
        <Kpi label="Open tickets" value={String(openTickets)} sub={`${my.tix.length} total`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Recent invoices" href="/portal/invoices" icon={FileText}>
          {my.inv.length === 0 ? (
            <Empty text="No invoices yet." />
          ) : (
            my.inv.slice(0, 4).map((i: any) => (
              <Row key={i.id} left={<><b>{i.number}</b> · <span className="text-muted-foreground">{formatDate(i.issueDate)}</span></>} right={<Badge>{i.status}</Badge>} />
            ))
          )}
        </Card>

        <Card title="Contracts" href="/portal/contracts" icon={ScrollText}>
          {my.con.length === 0 ? (
            <Empty text="No contracts yet." />
          ) : (
            my.con.slice(0, 4).map((c: any) => (
              <Row key={c.id} left={<><b>{c.title}</b> · <span className="text-muted-foreground">{formatCurrency(c.value)}</span></>} right={<Badge>{c.status}</Badge>} />
            ))
          )}
        </Card>

        <Card title="Recent payments" href="/portal/payments" icon={CreditCard}>
          {my.pay.length === 0 ? (
            <Empty text="No payments yet." />
          ) : (
            my.pay.slice(0, 4).map((p: any) => (
              <Row key={p.id} left={<><b>{p.name}</b> · <span className="text-muted-foreground">{p.meta?.method}</span></>} right={<Badge>{formatCurrency(Number(p.meta?.amount || 0))}</Badge>} />
            ))
          )}
        </Card>

        <Card title="Support" href="/portal/support" icon={LifeBuoy}>
          {my.tix.length === 0 ? (
            <Empty text="No tickets — need help? Open one." />
          ) : (
            my.tix.slice(0, 4).map((t: any) => (
              <Row key={t.id} left={<><b>{t.subject}</b></>} right={<Badge>{t.status}</Badge>} />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-divider bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#999" }}>{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[11px]" style={{ color: "#888" }}>{sub}</div>}
    </div>
  );
}

function Card({ title, href, icon: Icon, children }: { title: string; href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-divider bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div className="text-sm font-black">{title}</div>
        </div>
        <Link to={href} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-divider py-2 text-xs last:border-b-0">
      <div className="min-w-0 truncate">{left}</div>
      <div className="ml-3 shrink-0">{right}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{children}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-divider p-4 text-center text-xs" style={{ color: "#888" }}>{text}</div>;
}
