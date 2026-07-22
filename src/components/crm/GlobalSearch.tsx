import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Users, Building2, BadgeDollarSign, FolderKanban, CheckSquare, Receipt, Flame } from "lucide-react";
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

  // ⌘K / Ctrl+K
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

  // Click outside
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
    return out.slice(0, 20);
  }, [q, contacts, companies, deals, projects, tasks, invoices, leads]);

  useEffect(() => { setActive(0); }, [q]);

  const go = (h: Hit) => {
    setOpen(false);
    setQ("");
    navigate({ to: h.to as any, params: h.params as any });
  };

  return (
    <div ref={wrapRef} className="relative hidden xl:block w-[320px]">
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
        placeholder="Search clients, deals, tasks…"
        className="glass-chip w-full rounded-2xl py-3 pl-11 pr-16 text-sm outline-none placeholder:text-[#B08A93] focus:ring-2 focus:ring-primary/30"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-primary">⌘K</kbd>

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
