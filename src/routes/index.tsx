import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentUser } from "@/lib/crm/hooks";
import { ArrowUpRight, Users, FolderKanban, CheckCircle2, Activity as ActivityIcon, Wallet, CalendarClock, Receipt, AlertTriangle, PieChart as PieIcon } from "lucide-react";
import type { ListItem } from "@/lib/crm/types";

const EMPTY_LIST: ListItem[] = [];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · MetaEdge Creatives CRM" },
      { name: "description", content: "Glassmorphic overview of pipeline, projects, and creative operations." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useCurrentUser();
  const contacts = useCRM((s) => s.contacts);
  const projects = useCRM((s) => s.projects);
  const tasks = useCRM((s) => s.tasks);
  const invoices = useCRM((s) => s.invoices);
  const leads = useCRM((s) => s.leads);
  const payments = useCRM((s) => s.lists.payments ?? EMPTY_LIST);

  const activeProjects = projects.filter((p) => p.status !== "delivered");
  const openTasks = tasks.filter((t) => !t.done);

  // Payments & invoice metrics (realtime via zustand)
  const financeStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);
    const today = now.getTime();
    let payToday = 0, payMonth = 0;
    for (const p of payments as any[]) {
      const status = String(p.status ?? "").toLowerCase();
      if (status && status !== "completed" && status !== "paid" && status !== "received") continue;
      const amt = Number(p.amount) || 0;
      const date = String(p.date ?? p.createdAt ?? "").slice(0, 10);
      if (date === todayStr) payToday += amt;
      if (date.startsWith(monthStr)) payMonth += amt;
    }
    let due = 0, overdue = 0;
    for (const inv of invoices) {
      if (inv.status === "paid" || inv.status === "cancelled" || inv.status === "draft") continue;
      const total = inv.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const withTax = total * (1 + (inv.taxRate || 0) / 100) - (inv.discount || 0);
      const dueTs = inv.dueDate ? new Date(inv.dueDate).getTime() : 0;
      if (inv.status === "overdue" || (dueTs && dueTs < today)) overdue += withTax;
      else due += withTax;
    }
    return { payToday, payMonth, due, overdue };
  }, [payments, invoices]);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: "Clients",  value: String(contacts.length),        delta: `${contacts.length} total`,                icon: Users,           tint: "from-[#F58AA0] to-[#E23A56]" },
    
    { label: "Projects", value: String(activeProjects.length),  delta: `${projects.length - activeProjects.length} delivered`, icon: FolderKanban, tint: "from-[#FFB1BF] to-[#BF1833]" },
    { label: "Tasks",    value: String(openTasks.length),       delta: `${tasks.filter(t => t.done).length} done`,icon: CheckCircle2,    tint: "from-[#E23A56] to-[#8E0F24]" },
    { label: "Payments · Today",   value: fmt(financeStats.payToday),  delta: "received",  icon: Wallet,        tint: "from-[#FDC7D0] to-[#E23A56]" },
    { label: "Payments · Month",   value: fmt(financeStats.payMonth),  delta: "MTD",       icon: CalendarClock, tint: "from-[#F58AA0] to-[#8E0F24]" },
    { label: "Invoices · Due",     value: fmt(financeStats.due),       delta: "open",      icon: Receipt,       tint: "from-[#FFB1BF] to-[#BF1833]" },
    { label: "Invoices · Overdue", value: fmt(financeStats.overdue),   delta: "late",      icon: AlertTriangle, tint: "from-[#E23A56] to-[#8E0F24]" },
  ];


  const trackerProjects = activeProjects.slice(0, 4).map((p) => {
    const total = p.deliverables?.length ?? 0;
    const done = p.deliverables?.filter((d) => d.done).length ?? 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : ({ brief: 10, in_progress: 45, review: 80, delivered: 100 }[p.status] ?? 0);
    const sub = ({ brief: "Brief", in_progress: "In Progress", review: "Review", delivered: "Delivered" } as const)[p.status];
    return { id: p.id, name: p.name, sub, pct };
  });

  // Real activity feed: every record we know about with a timestamp.
  const activityItems = useMemo(() => {
    const items: { at: string }[] = [];
    for (const c of contacts) items.push({ at: c.createdAt });
    for (const p of projects) items.push({ at: p.createdAt });
    for (const t of tasks)    items.push({ at: t.createdAt });
    for (const i of invoices) items.push({ at: i.createdAt });
    for (const l of leads)    items.push({ at: l.createdAt });
    return items;
  }, [contacts, projects, tasks, invoices, leads]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPI row */}
      {kpis.map((k) => (
        <div key={k.label} className="widget-card col-span-12 sm:col-span-6 xl:col-span-3 p-6">
          <div className="flex items-start justify-between">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${k.tint} shadow-[0_12px_28px_-10px_rgba(191,24,51,0.55)]`}>
              <k.icon className="h-6 w-6 text-white" strokeWidth={2.4} />
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              {k.delta}
            </span>
          </div>
          <div className="mt-6 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#B08A93" }}>
            {k.label}
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight" style={{ color: "#2A1418" }}>{k.value}</div>
        </div>
      ))}

      {/* Activity chart — real data across all modules */}
      <ActivityChart items={activityItems} />

      {/* Leads pie chart — realtime */}
      <LeadsPie leads={leads} />

      {/* Project Tracker */}
      <div className="widget-card col-span-12 p-7">
        <SectionHeader eyebrow="Live" title="Project Tracker" action={<Link to="/projects" className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary transition hover:-translate-y-0.5">See all <ArrowUpRight className="h-3.5 w-3.5" /></Link>} />
        {trackerProjects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-primary/25 bg-white/40 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-black" style={{ color: "#2A1418" }}>No active projects yet</div>
            <div className="mt-1 text-xs" style={{ color: "#7A6870" }}>Create your first project to see live progress here.</div>
            <Link to="/projects" className="mt-4 inline-flex rounded-full bg-primary px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">New Project</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {trackerProjects.map((p, idx) => (
              <div key={p.id} className="group flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${["from-[#E23A56] to-[#8E0F24]","from-[#F58AA0] to-[#BF1833]","from-[#FFB1BF] to-[#E23A56]","from-[#FDC7D0] to-[#BF1833]"][idx % 4]} shadow-[0_8px_18px_-8px_rgba(191,24,51,0.6)]`}>
                  <FolderKanban className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="truncate text-sm font-black" style={{ color: "#2A1418" }}>{p.name}</div>
                    <div className="text-[11px] font-black text-primary">{p.pct}%</div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#B08A93" }}>{p.sub}</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.pct}%`,
                        background: "linear-gradient(90deg, #E23A56, #BF1833)",
                        boxShadow: "0 0 12px rgba(191,24,51,0.55)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</div>
        <h3 className="mt-1 text-xl font-black tracking-tight" style={{ color: "#2A1418" }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

type Range = "7d" | "30d" | "90d" | "365d" | "custom";

function ActivityChart({ items }: { items: { at: string }[] }) {
  const [range, setRange] = useState<Range>("30d");
  const [from, setFrom] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const { days, startTs } = useMemo(() => {
    if (range === "custom") {
      const a = new Date(from).getTime();
      const b = new Date(to).getTime();
      const d = Math.max(1, Math.round((b - a) / 86400000) + 1);
      return { days: d, startTs: a };
    }
    const d = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (d - 1));
    return { days: d, startTs: start.getTime() };
  }, [range, from, to]);

  const series = useMemo(() => {
    const buckets = new Array(days).fill(0) as number[];
    for (const it of items) {
      const t = new Date(it.at).getTime();
      const idx = Math.floor((t - startTs) / 86400000);
      if (idx >= 0 && idx < days) buckets[idx] += 1;
    }
    return buckets;
  }, [items, days, startTs]);

  const total = series.reduce((a, b) => a + b, 0);
  const max = Math.max(...series, 1);
  const w = 1000;
  const h = 260;
  const stepX = series.length > 1 ? w / (series.length - 1) : w;
  const points = series.map((v, i) => {
    const x = i * stepX;
    const y = h - (v / max) * (h - 20) - 10;
    return [x, y] as const;
  });
  const linePath = points.length
    ? points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ")
    : "";

  const options: { key: Range; label: string }[] = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "365d", label: "1 year" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="widget-card col-span-12 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Activity</div>
          <h3 className="mt-1 text-2xl font-black tracking-tight" style={{ color: "#2A1418" }}>
            {total} {total === 1 ? "record" : "records"} created
          </h3>
          <div className="text-[11px] font-bold" style={{ color: "#B08A93" }}>
            Last {days} day{days === 1 ? "" : "s"} · across clients, projects, tasks, invoices & leads
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setRange(o.key)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest transition ${
                range === o.key
                  ? "bg-primary text-white shadow-[0_8px_18px_-8px_rgba(191,24,51,0.6)]"
                  : "bg-white/70 text-primary hover:bg-white"
              }`}
            >
              {o.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5">
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-[11px] font-bold text-primary outline-none" />
              <span className="text-[11px] font-bold text-primary">→</span>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-[11px] font-bold text-primary outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 h-[320px] w-full">
        {total === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white/40 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-black" style={{ color: "#2A1418" }}>No activity in this range yet</div>
            <div className="mt-1 text-xs" style={{ color: "#7A6870" }}>Add clients, projects, or tasks — the chart updates live.</div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="rgba(42,20,24,0.08)" strokeDasharray="4 6" />
            ))}
            <path d={linePath} fill="none" stroke="#BF1833" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </div>
  );
}

const LEAD_PIE_BUCKETS: { key: string; label: string; color: string; match: (s: string) => boolean }[] = [
  { key: "new",          label: "New",           color: "#E23A56", match: (s) => s === "new" },
  { key: "contacted",    label: "Contacted",     color: "#F58AA0", match: (s) => s === "contacted" },
  { key: "qualified",    label: "Qualified",     color: "#BF1833", match: (s) => s === "qualified" },
  { key: "disqualified", label: "Disqualified",  color: "#8E0F24", match: (s) => s === "disqualified" || s === "lost" },
  { key: "proposal",     label: "Proposal Sent", color: "#FFB1BF", match: (s) => s === "proposal_sent" || s === "proposal" },
  { key: "converted",    label: "Converted",     color: "#2A1418", match: (s) => s === "converted" },
];

function LeadsPie({ leads }: { leads: { status: string }[] }) {
  const { slices, total } = useMemo(() => {
    const counts = LEAD_PIE_BUCKETS.map((b) => ({ ...b, count: 0 }));
    for (const l of leads) {
      const s = String(l.status ?? "").toLowerCase();
      const bucket = counts.find((b) => b.match(s));
      if (bucket) bucket.count += 1;
    }
    const t = counts.reduce((a, b) => a + b.count, 0);
    return { slices: counts, total: t };
  }, [leads]);

  const size = 220;
  const r = 92;
  const cx = size / 2;
  const cy = size / 2;
  let acc = 0;
  const paths = slices.map((s) => {
    if (s.count === 0 || total === 0) return { ...s, d: "", pct: 0 };
    const frac = s.count / total;
    const start = acc * Math.PI * 2 - Math.PI / 2;
    acc += frac;
    const end = acc * Math.PI * 2 - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    // Single 100% slice → draw a full circle instead of a degenerate arc.
    const d = frac >= 1
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...s, d, pct: Math.round(frac * 100) };
  });

  return (
    <div className="widget-card col-span-12 lg:col-span-6 p-7">
      <SectionHeader eyebrow="Realtime" title="Leads by Status" action={
        <Link to="/leads" className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary transition hover:-translate-y-0.5">
          Manage <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      } />
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="relative">
          {total === 0 ? (
            <div className="flex h-[220px] w-[220px] flex-col items-center justify-center rounded-full border border-dashed border-primary/25 bg-white/40 text-center">
              <PieIcon className="mb-2 h-6 w-6 text-primary/60" />
              <div className="text-xs font-black" style={{ color: "#2A1418" }}>No leads yet</div>
            </div>
          ) : (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {paths.map((p) => p.d && (
                <path key={p.key} d={p.d} fill={p.color} stroke="#fff" strokeWidth={2} />
              ))}
              <circle cx={cx} cy={cy} r={46} fill="#fff" />
              <text x={cx} y={cy - 4} textAnchor="middle" className="fill-[#2A1418]" style={{ fontSize: 22, fontWeight: 900 }}>{total}</text>
              <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[#B08A93]" style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>LEADS</text>
            </svg>
          )}
        </div>
        <ul className="flex-1 min-w-[180px] space-y-2">
          {paths.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.color }} />
                <span className="font-bold" style={{ color: "#2A1418" }}>{p.label}</span>
              </span>
              <span className="font-black tabular-nums" style={{ color: "#7A6870" }}>
                {p.count}<span className="ml-1 text-[10px] font-bold text-primary">{total > 0 ? `${p.pct}%` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
