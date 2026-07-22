import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/crm/types";
import { NoAccess } from "@/components/crm/AppShell";
import {
  Plus, Search, Flame, Mail, Phone, Building2, ArrowLeft, Save,
  Trash2, Pencil, ArrowRight, LayoutGrid, List as ListIcon, Rocket,
  Upload, Download, Filter, Pin, Star, Eye, MoreHorizontal, Archive,
} from "lucide-react";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads · MetaEdge CRM" }] }),
  component: LeadsPage,
});

type Mode =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; lead: Lead }
  | { kind: "view"; lead: Lead };

const SOURCES = ["Referral", "Instagram", "Facebook", "Website", "LinkedIn", "Google", "Event", "Cold Outreach", "Other"];

function LeadsPage() {
  const can = useCan("leads");
  const leads = useCRM((s) => s.leads);
  const users = useCRM((s) => s.users);
  const addLead = useCRM((s) => s.addLead);
  const updateLead = useCRM((s) => s.updateLead);
  const setLeadStatus = useCRM((s) => s.setLeadStatus);
  const deleteLead = useCRM((s) => s.deleteLead);
  const addDeal = useCRM((s) => s.addDeal);

  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [view, setView] = useState<"board" | "table">("board");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  if (!can) return <NoAccess module="Leads" />;

  if (mode.kind === "new" || mode.kind === "edit") {
    const editing = mode.kind === "edit" ? mode.lead : null;
    return (
      <LeadEditor
        editing={editing}
        onCancel={() => setMode(editing ? { kind: "view", lead: editing } : { kind: "list" })}
        onSubmit={(data) => {
          if (editing) {
            updateLead(editing.id, data);
            setMode({ kind: "view", lead: { ...editing, ...data } });
          } else {
            const created = addLead(data);
            setMode({ kind: "view", lead: created });
          }
        }}
      />
    );
  }

  if (mode.kind === "view") {
    const l = leads.find((x) => x.id === mode.lead.id) ?? mode.lead;
    return (
      <LeadDetail
        lead={l}
        onBack={() => setMode({ kind: "list" })}
        onEdit={() => setMode({ kind: "edit", lead: l })}
        onStatus={(s) => setLeadStatus(l.id, s)}
        onDelete={() => {
          if (confirm("Delete this lead?")) {
            deleteLead(l.id);
            setMode({ kind: "list" });
          }
        }}
        onConvert={() => {
          addDeal({
            title: `${l.name}${l.company ? " · " + l.company : ""}`,
            value: 0,
            stage: "qualified",
            notes: l.notes,
          });
          setLeadStatus(l.id, "converted");
          alert("Lead converted to a deal. Open Deals to continue.");
        }}
      />
    );
  }

  const filtered = leads.filter((l) => {
    if (sourceFilter && (l.source || "") !== sourceFilter) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [l.name, l.email, l.company, l.phone, l.source, l.notes]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });

  const totals = useMemo(() => {
    const t: Record<LeadStatus, number> = { new: 0, contacted: 0, qualified: 0, disqualified: 0, proposal_sent: 0, converted: 0 };
    leads.forEach((l) => { if (t[l.status] !== undefined) t[l.status]++; });
    return t;
  }, [leads]);
  const avgScore = leads.length ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0;

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selected[l.id]);
  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelected({});
    else {
      const next: Record<string, boolean> = {};
      filtered.forEach((l) => { next[l.id] = true; });
      setSelected(next);
    }
  };

  const exportLeads = (list: Lead[]) => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV = (list: Lead[]) => {
    const headers = ["name","email","phone","company","source","score","status","notes","createdAt"];
    const rows = list.map((l) => headers.map((h) => JSON.stringify((l as any)[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      let items: any[] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const [head, ...rest] = text.split(/\r?\n/).filter(Boolean);
        const headers = head.split(",").map((h) => h.trim());
        items = rest.map((line) => {
          const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
          return obj;
        });
      } else {
        items = JSON.parse(text);
      }
      let count = 0;
      items.forEach((r) => {
        if (!r?.name) return;
        addLead({
          name: String(r.name),
          email: r.email || "",
          phone: r.phone || "",
          company: r.company || "",
          source: r.source || "",
          score: Number(r.score) || 50,
          status: (LEAD_STATUSES.find((s) => s.id === r.status)?.id ?? "new") as LeadStatus,
          notes: r.notes || "",
        });
        count++;
      });
      alert(`Imported ${count} lead(s).`);
    } catch (e) {
      alert("Import failed. Please upload a valid JSON or CSV file.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="widget-card flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Prospect Pipeline</div>
          <h1 className="text-3xl font-black" style={{ color: "#2A1418" }}>Leads</h1>
          <p className="mt-1 text-sm" style={{ color: "#666" }}>
            Capture, qualify and convert prospects into paying clients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-2xl border border-black/10 bg-white/70">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold ${view === "board" ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold ${view === "table" ? "bg-primary text-white" : "text-primary hover:bg-primary/10"}`}
            >
              <ListIcon className="h-3.5 w-3.5" /> Table
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button
            onClick={() => exportLeads(filtered)}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setMode({ kind: "new" })}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> New Lead
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Kpi label="Total" value={leads.length} />
        {LEAD_STATUSES.map((s) => (
          <Kpi key={s.id} label={s.label} value={totals[s.id]} />
        ))}
        <Kpi label="Avg score" value={avgScore} suffix="/100" />
      </div>

      {/* Filters */}
      <div className="widget-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, email…"
            className="w-full rounded-2xl border border-black/10 bg-white/80 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm outline-none"
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2.5 text-sm outline-none"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {(query || sourceFilter || statusFilter) && (
          <button
            onClick={() => { setQuery(""); setSourceFilter(""); setStatusFilter(""); }}
            className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            Clear
          </button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="widget-card flex flex-wrap items-center gap-3 p-4">
          <div className="text-sm font-bold text-primary">{selectedIds.length} selected</div>
          <button
            onClick={toggleSelectAll}
            className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
          >
            {allFilteredSelected ? "Unselect all" : "Select all filtered"}
          </button>
          <button
            onClick={() => exportLeads(leads.filter((l) => selected[l.id]))}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> Export selected
          </button>
          <select
            onChange={(e) => {
              const v = e.target.value as LeadStatus | "";
              if (!v) return;
              selectedIds.forEach((id) => setLeadStatus(id, v));
              e.target.value = "";
            }}
            className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold text-primary"
          >
            <option value="">Change status…</option>
            {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.length} lead(s)?`)) {
                selectedIds.forEach((id) => deleteLead(id));
                setSelected({});
              }
            }}
            className="ml-auto flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white hover:-translate-y-0.5 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="widget-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-black" style={{ color: "#2A1418" }}>No leads yet</h3>
          <p className="mt-1 text-sm" style={{ color: "#666" }}>Add your first prospect to start tracking who's interested.</p>
          <button
            onClick={() => setMode({ kind: "new" })}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> New Lead
          </button>
        </div>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {LEAD_STATUSES.map((col) => {
            const list = filtered.filter((l) => l.status === col.id);
            return (
              <div key={col.id} className="widget-card flex min-h-[280px] flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">{col.label}</div>
                  <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{list.length}</div>
                </div>
                <div className="flex-1 space-y-2">
                  {list.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setMode({ kind: "view", lead: l })}
                      className="w-full rounded-2xl border border-black/5 bg-white/90 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_24px_-12px_rgba(191,24,51,0.35)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-bold" style={{ color: "#2A1418" }}>{l.name}</div>
                        <ScorePill score={l.score} />
                      </div>
                      {l.company && <div className="mt-1 truncate text-[11px]" style={{ color: "#666" }}>{l.company}</div>}
                      <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: "#999" }}>
                        {l.source && <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-primary">{l.source}</span>}
                        <span>{formatDate(l.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-[11px]" style={{ color: "#999" }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="widget-card overflow-visible">
          <table className="w-full text-sm">
            <thead className="border-b border-black/5 bg-primary/5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "#666" }}>
              <tr>
                <th className="px-4 py-3 text-left font-black w-8">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left font-black">Title</th>
                <th className="px-4 py-3 text-left font-black">Contact</th>
                <th className="px-4 py-3 text-left font-black">Created</th>
                <th className="px-4 py-3 text-left font-black">Value</th>
                <th className="px-4 py-3 text-left font-black">Assigned</th>
                <th className="px-4 py-3 text-left font-black">Category</th>
                <th className="px-4 py-3 text-left font-black">Status</th>
                <th className="px-4 py-3 text-right font-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  users={users}
                  selected={!!selected[l.id]}
                  onToggle={() => toggleSelect(l.id)}
                  onView={() => setMode({ kind: "view", lead: l })}
                  onEmail={() => { if (l.email) window.location.href = `mailto:${l.email}`; else alert("No email on this lead."); }}
                  onPin={() => updateLead(l.id, { pinned: !l.pinned })}
                  onStar={() => updateLead(l.id, { starred: !l.starred })}
                  onDelete={() => { if (confirm("Delete lead?")) deleteLead(l.id); }}
                  onChangeCategory={(c) => updateLead(l.id, { category: c })}
                  onChangeStatus={(s) => setLeadStatus(l.id, s)}
                  onArchive={() => updateLead(l.id, { archived: !l.archived })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeadRow({
  lead: l, users, selected, onToggle, onView, onEmail, onPin, onStar, onDelete,
  onChangeCategory, onChangeStatus, onArchive,
}: {
  lead: Lead;
  users: { id: string; name: string }[];
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onEmail: () => void;
  onPin: () => void;
  onStar: () => void;
  onDelete: () => void;
  onChangeCategory: (c: string) => void;
  onChangeStatus: (s: LeadStatus) => void;
  onArchive: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<null | "cat" | "status">(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuOpen(false); setSubMenu(null); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);
  const assignedNames = (l.assignedUserIds ?? [])
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean) as string[];
  const statusLabel = LEAD_STATUSES.find((s) => s.id === l.status)?.label ?? l.status;
  return (
    <tr className={`border-b border-black/5 last:border-0 hover:bg-primary/5 ${l.archived ? "opacity-60" : ""}`}>
      <td className="px-4 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle} />
      </td>
      <td className="px-4 py-3">
        <button onClick={onView} className="text-left">
          <div className="flex items-center gap-1.5 font-bold" style={{ color: "#2A1418" }}>
            {l.pinned && <Pin className="h-3 w-3 fill-primary text-primary" />}
            {l.starred && <Star className="h-3 w-3 fill-primary text-primary" />}
            {l.title || l.name}
          </div>
          {l.company && <div className="text-[11px]" style={{ color: "#999" }}>{l.company}</div>}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium" style={{ color: "#2A1418" }}>{l.name}</div>
        <div className="text-[11px]" style={{ color: "#999" }}>{l.email || "—"}{l.phone ? ` · ${l.phone}` : ""}</div>
      </td>
      <td className="px-4 py-3" style={{ color: "#666" }}>{formatDate(l.createdAt)}</td>
      <td className="px-4 py-3 font-bold" style={{ color: "#2A1418" }}>{l.value ? `$${Number(l.value).toLocaleString()}` : "—"}</td>
      <td className="px-4 py-3" style={{ color: "#666" }}>
        {assignedNames.length ? (
          <div className="flex flex-wrap gap-1">
            {assignedNames.slice(0, 2).map((n) => (
              <span key={n} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{n}</span>
            ))}
            {assignedNames.length > 2 && <span className="text-[10px]">+{assignedNames.length - 2}</span>}
          </div>
        ) : "—"}
      </td>
      <td className="px-4 py-3" style={{ color: "#666" }}>
        {l.category ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{l.category}</span>
        ) : "—"}
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold">{statusLabel}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-0.5" ref={menuRef}>
          <IconAction label="View Details" onClick={onView}><Eye className="h-3.5 w-3.5" /></IconAction>
          <IconAction label="Send Email" onClick={onEmail}><Mail className="h-3.5 w-3.5" /></IconAction>
          <IconAction label={l.pinned ? "Unpin" : "Pin"} onClick={onPin} active={l.pinned}><Pin className="h-3.5 w-3.5" /></IconAction>
          <IconAction label={l.starred ? "Unstar" : "Star"} onClick={onStar} active={l.starred}><Star className="h-3.5 w-3.5" /></IconAction>
          <IconAction label="Delete" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></IconAction>
          <div className="relative">
            <IconAction label="More" onClick={() => { setMenuOpen((v) => !v); setSubMenu(null); }}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </IconAction>
            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]">
                <button onClick={() => setSubMenu(subMenu === "cat" ? null : "cat")} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10">
                  Change Category <ArrowRight className="h-3 w-3" />
                </button>
                {subMenu === "cat" && (
                  <div className="border-t border-black/5 bg-primary/5 px-3 py-2">
                    {["Hot", "Warm", "Cold", "VIP", "Retainer"].map((c) => (
                      <button key={c} onClick={() => { onChangeCategory(c); setMenuOpen(false); setSubMenu(null); }} className="block w-full py-1 text-left text-xs hover:text-primary">
                        {c}
                      </button>
                    ))}
                    <button onClick={() => { const c = prompt("Category name"); if (c) { onChangeCategory(c); setMenuOpen(false); setSubMenu(null); } }} className="block w-full py-1 text-left text-xs italic hover:text-primary">
                      Custom…
                    </button>
                  </div>
                )}
                <button onClick={() => setSubMenu(subMenu === "status" ? null : "status")} className="flex w-full items-center justify-between border-t border-black/5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10">
                  Change Status <ArrowRight className="h-3 w-3" />
                </button>
                {subMenu === "status" && (
                  <div className="border-t border-black/5 bg-primary/5 px-3 py-2">
                    {LEAD_STATUSES.map((s) => (
                      <button key={s.id} onClick={() => { onChangeStatus(s.id); setMenuOpen(false); setSubMenu(null); }} className="block w-full py-1 text-left text-xs hover:text-primary">
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { onArchive(); setMenuOpen(false); setSubMenu(null); }} className="flex w-full items-center gap-2 border-t border-black/5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10">
                  <Archive className="h-3 w-3" /> {l.archived ? "Unarchive" : "Archive"}
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function IconAction({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group relative rounded-lg p-2 transition ${active ? "bg-primary/15 text-primary" : "text-primary hover:bg-primary/10"}`}
    >
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function Kpi({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="widget-card p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</div>
      <div className="mt-1 text-2xl font-black" style={{ color: "#2A1418" }}>
        {value}<span className="text-sm font-bold" style={{ color: "#999" }}>{suffix}</span>
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 75 ? "bg-primary text-white" : score >= 40 ? "bg-primary/15 text-primary" : "bg-black/5 text-black/60";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${color}`}>
      <Flame className="h-3 w-3" /> {score}
    </span>
  );
}

/* ---------- Editor (dedicated page) ---------- */
function LeadEditor({
  editing,
  onCancel,
  onSubmit,
}: {
  editing: Lead | null;
  onCancel: () => void;
  onSubmit: (data: Omit<Lead, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState<Omit<Lead, "id" | "createdAt">>({
    name: "", email: "", phone: "", company: "", source: "", score: 50, status: "new", notes: "",
  });
  useEffect(() => {
    if (editing) {
      const { id: _i, createdAt: _c, ...rest } = editing;
      setForm(rest);
    }
  }, [editing]);

  const submit = () => {
    if (!form.name.trim()) { alert("Please enter a name"); return; }
    onSubmit(form);
  };

  return (
    <div className="space-y-6">
      <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Leads</div>
            <h2 className="text-xl font-black" style={{ color: "#2A1418" }}>{editing ? "Edit lead" : "New lead"}</h2>
          </div>
        </div>
        <button onClick={submit} className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] hover:-translate-y-0.5 transition">
          <Save className="h-4 w-4" /> {editing ? "Save changes" : "Create lead"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="widget-card space-y-4 p-6 lg:col-span-2">
          <SectionLabel>Contact information</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name *">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ayesha Khan" />
            </Field>
            <Field label="Company">
              <input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Acme Studios" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="name@example.com" />
            </Field>
            <Field label="Phone">
              <input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+92 300 …" />
            </Field>
          </div>

          <SectionLabel>Notes</SectionLabel>
          <textarea
            rows={5}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="What are they looking for? Budget, timeline, references…"
            className={inputCls}
          />
        </div>

        <div className="widget-card space-y-4 p-6">
          <SectionLabel>Qualification</SectionLabel>
          <Field label="Source">
            <select value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls}>
              <option value="">Select source</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })} className={inputCls}>
              {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label={`Score (${form.score}/100)`}>
            <input type="range" min={0} max={100} value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              className="w-full accent-[#BF1833]" />
            <div className="mt-1 flex justify-between text-[10px] font-bold" style={{ color: "#999" }}>
              <span>Cold</span><span>Warm</span><span>Hot</span>
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------- Detail ---------- */
function LeadDetail({
  lead, onBack, onEdit, onDelete, onStatus, onConvert,
}: {
  lead: Lead;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (s: LeadStatus) => void;
  onConvert: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">
            <ArrowLeft className="h-4 w-4" /> Leads
          </button>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Lead</div>
            <h2 className="text-2xl font-black" style={{ color: "#2A1418" }}>{lead.name}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onEdit} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={onConvert} className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)]">
            <Rocket className="h-4 w-4" /> Convert to deal
          </button>
          <button onClick={onDelete} className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="widget-card space-y-4 p-6 lg:col-span-2">
          <SectionLabel>Overview</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoRow icon={Building2} label="Company" value={lead.company || "—"} />
            <InfoRow icon={Mail} label="Email" value={lead.email || "—"} />
            <InfoRow icon={Phone} label="Phone" value={lead.phone || "—"} />
            <InfoRow icon={ArrowRight} label="Source" value={lead.source || "—"} />
          </div>
          <SectionLabel>Notes</SectionLabel>
          <div className="whitespace-pre-wrap rounded-2xl border border-black/5 bg-white/70 p-4 text-sm" style={{ color: "#333" }}>
            {lead.notes || "No notes yet."}
          </div>
        </div>

        <div className="widget-card space-y-4 p-6">
          <SectionLabel>Status</SectionLabel>
          <div className="space-y-2">
            {LEAD_STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => onStatus(s.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${lead.status === s.id ? "border-primary bg-primary text-white" : "border-black/10 bg-white text-primary hover:bg-primary/10"}`}
              >
                <span>{s.label}</span>
                {lead.status === s.id && <span className="text-[10px] font-black uppercase">Current</span>}
              </button>
            ))}
          </div>
          <SectionLabel>Score</SectionLabel>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">{lead.score}</span>
              <span className="text-sm font-bold" style={{ color: "#999" }}>/100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10">
              <div className="h-full rounded-full bg-primary" style={{ width: `${lead.score}%` }} />
            </div>
          </div>
          <div className="text-[11px]" style={{ color: "#999" }}>
            Added {formatDate(lead.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-primary">{label}</label>
      {children}
    </div>
  );
}
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/70 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-widest text-primary">{label}</div>
        <div className="truncate text-sm font-bold" style={{ color: "#2A1418" }}>{value}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
