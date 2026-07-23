import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, Users, Building2, BadgeDollarSign, FolderKanban, CheckSquare,
  Receipt, Flame, Compass, Inbox, LayoutDashboard, Settings, Mail, FileText,
  BarChart3, MessageSquare, Calendar, Package, Tag, HeadphonesIcon,
} from "lucide-react";
import { useCRM } from "@/lib/crm/store";

type Hit = {
  id: string;
  label: string;
  sub?: string;
  group: string;
  to: string;
  params?: Record<string, string>;
  icon: React.ComponentType<{ className?: string }>;
};

// App navigation items — always searchable, so "Client", "Invoice", "Report" etc.
// always surface something even when the CRM lists are empty.
const NAV_ITEMS: Hit[] = [
  { id: "nav-dashboard", label: "Dashboard", sub: "Home overview", group: "Menu", to: "/", icon: LayoutDashboard },
  { id: "nav-contacts", label: "Contacts", sub: "Clients & people", group: "Menu", to: "/contacts", icon: Users },
  { id: "nav-companies", label: "Companies", sub: "Client organizations", group: "Menu", to: "/companies", icon: Building2 },
  { id: "nav-leads", label: "Leads", sub: "Prospect pipeline", group: "Menu", to: "/leads", icon: Flame },
  { id: "nav-deals", label: "Deals", sub: "Sales pipeline", group: "Menu", to: "/deals", icon: BadgeDollarSign },
  { id: "nav-projects", label: "Projects", sub: "Active work", group: "Menu", to: "/projects", icon: FolderKanban },
  { id: "nav-tasks", label: "Tasks", sub: "To-dos", group: "Menu", to: "/tasks", icon: CheckSquare },
  { id: "nav-service-requests", label: "Service Requests", sub: "Client inbox", group: "Menu", to: "/service-requests", icon: Inbox },
  { id: "nav-client-users", label: "Client Users", sub: "Portal accounts", group: "Menu", to: "/customers/client-users", icon: Users },
  { id: "nav-proposals", label: "Proposals", sub: "Sent quotes", group: "Menu", to: "/proposals", icon: FileText },
  { id: "nav-invoices", label: "Invoices", sub: "Billing", group: "Menu", to: "/invoices", icon: Receipt },
  { id: "nav-estimates", label: "Estimates", sub: "Draft quotes", group: "Menu", to: "/estimates", icon: FileText },
  { id: "nav-payments", label: "Payments", sub: "Received", group: "Menu", to: "/payments", icon: BadgeDollarSign },
  { id: "nav-contracts", label: "Contracts", sub: "Agreements", group: "Menu", to: "/contracts", icon: FileText },
  { id: "nav-subscriptions", label: "Subscriptions", sub: "Recurring", group: "Menu", to: "/subscriptions", icon: Calendar },
  { id: "nav-expenses", label: "Expenses", sub: "Costs", group: "Menu", to: "/expenses", icon: Receipt },
  { id: "nav-tax", label: "Tax", sub: "Tax settings", group: "Menu", to: "/tax", icon: Receipt },
  { id: "nav-refunds", label: "Refunds", sub: "Issued refunds", group: "Menu", to: "/refunds", icon: Receipt },
  { id: "nav-products", label: "Products & Services", sub: "Catalog", group: "Menu", to: "/products", icon: Package },
  { id: "nav-reports", label: "Reports", sub: "Analytics", group: "Menu", to: "/reports", icon: BarChart3 },
  { id: "nav-email", label: "Email Marketing", sub: "Campaigns", group: "Menu", to: "/email-marketing", icon: Mail },
  { id: "nav-tickets", label: "Tickets", sub: "Support queue", group: "Menu", to: "/tickets", icon: HeadphonesIcon },
  { id: "nav-support", label: "Support", sub: "Help center", group: "Menu", to: "/support", icon: MessageSquare },
  { id: "nav-team", label: "Team", sub: "Members", group: "Menu", to: "/team", icon: Users },
  { id: "nav-user-roles", label: "User Roles", sub: "Permissions", group: "Menu", to: "/user-roles", icon: Users },
  { id: "nav-tags", label: "Tags", sub: "Labels", group: "Menu", to: "/tags", icon: Tag },
  { id: "nav-files", label: "Files", sub: "Uploads", group: "Menu", to: "/files", icon: FileText },
  { id: "nav-automations", label: "Automations", sub: "Workflows", group: "Menu", to: "/automations", icon: Compass },
  { id: "nav-knowledgebase", label: "Knowledgebase", sub: "Docs", group: "Menu", to: "/knowledgebase", icon: FileText },
  { id: "nav-milestones", label: "Milestones", sub: "Key dates", group: "Menu", to: "/milestones", icon: Calendar },
  { id: "nav-timesheets", label: "Timesheets", sub: "Logged time", group: "Menu", to: "/time-sheets", icon: Calendar },
  { id: "nav-modules", label: "Modules", sub: "Feature toggles", group: "Menu", to: "/modules", icon: Compass },
  { id: "nav-settings", label: "Settings", sub: "Preferences", group: "Menu", to: "/settings", icon: Settings },
];

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const contacts = useCRM((s) => s.contacts);
  const companies = useCRM((s) => s.companies);
  const deals = useCRM((s) => s.deals);
  const projects = useCRM((s) => s.projects);
  const tasks = useCRM((s) => s.tasks);
  const invoices = useCRM((s) => s.invoices);
  const leads = useCRM((s) => s.leads);
  const serviceRequests = useCRM((s) => s.serviceRequests);
  const clientUsers = useCRM((s) => s.clientUsers);

  // ⌘K / Ctrl+K anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const match = (...parts: (string | undefined | null)[]) =>
      parts.some((p) => (p ?? "").toLowerCase().includes(term));
    const out: Hit[] = [];

    // Menu items first so navigation always works
    for (const n of NAV_ITEMS) {
      if (match(n.label, n.sub)) out.push(n);
    }
    for (const c of clientUsers) {
      if (match(c.name, c.email, c.companyName))
        out.push({ id: c.id, label: c.name, sub: c.email || c.companyName, group: "Client Users", to: "/customers/client-users", icon: Users });
    }
    for (const r of serviceRequests) {
      if (match(r.title, r.clientName, r.clientEmail, r.description, r.status))
        out.push({ id: r.id, label: r.title, sub: `${r.clientName} · ${r.status}`, group: "Service Requests", to: "/service-requests", icon: Inbox });
    }
    for (const c of contacts) {
      if (match(c.name, c.email, c.phone, c.title))
        out.push({ id: c.id, label: c.name, sub: c.email || c.title, group: "Contacts", to: "/contacts/$id", params: { id: c.id }, icon: Users });
    }
    for (const c of companies) {
      if (match(c.name, c.industry, c.website))
        out.push({ id: c.id, label: c.name, sub: c.industry, group: "Companies", to: "/companies/$id", params: { id: c.id }, icon: Building2 });
    }
    for (const d of deals) {
      if (match(d.title, d.stage))
        out.push({ id: d.id, label: d.title, sub: d.stage, group: "Deals", to: "/deals/$id", params: { id: d.id }, icon: BadgeDollarSign });
    }
    for (const p of projects) {
      if (match(p.name, p.status))
        out.push({ id: p.id, label: p.name, sub: p.status, group: "Projects", to: "/projects/$id", params: { id: p.id }, icon: FolderKanban });
    }
    for (const t of tasks) {
      if (match(t.title))
        out.push({ id: t.id, label: t.title, sub: t.done ? "Done" : "Open", group: "Tasks", to: "/tasks", icon: CheckSquare });
    }
    for (const i of invoices) {
      if (match(i.number, i.status))
        out.push({ id: i.id, label: i.number || "Invoice", sub: i.status, group: "Invoices", to: "/invoices", icon: Receipt });
    }
    for (const l of leads) {
      if (match(l.name, l.email, l.source))
        out.push({ id: l.id, label: l.name, sub: l.source, group: "Leads", to: "/leads", icon: Flame });
    }
    return out.slice(0, 24);
  }, [q, contacts, companies, deals, projects, tasks, invoices, leads, serviceRequests, clientUsers]);

  useEffect(() => { setActive(0); }, [q]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    navigate({ to: h.to as any, params: h.params as any });
  };

  return (
    <div ref={wrapRef} className="relative w-[200px] sm:w-[260px] xl:w-[320px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#B08A93" }} />
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && hits[active]) { e.preventDefault(); go(hits[active]); }
        }}
        placeholder="Search anything…"
        className="glass-chip w-full rounded-2xl py-3 pl-11 pr-14 text-sm outline-none placeholder:text-[#B08A93] focus:ring-2 focus:ring-primary/30"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-primary hidden sm:block">⌘K</kbd>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-black/5 bg-white shadow-2xl z-50">
          {hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm" style={{ color: "#7A6870" }}>No results for "{q}"</div>
          ) : (
            <ul className="py-1">
              {hits.map((h, i) => (
                <li key={`${h.group}-${h.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-primary/10" : "hover:bg-primary/5"}`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <h.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold" style={{ color: "#2A1418" }}>{h.label}</div>
                      {h.sub && <div className="truncate text-[11px]" style={{ color: "#7A6870" }}>{h.sub}</div>}
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">{h.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
