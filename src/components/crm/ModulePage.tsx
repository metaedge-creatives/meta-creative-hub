import { useMemo, useRef, useState, type ComponentType } from "react";
import { Plus, Search, Pencil, Trash2, ArrowLeft, Save, Upload, Download, BarChart3, DollarSign, ListChecks } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import type { ListItem } from "@/lib/crm/types";

export interface ModuleField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: string[];
  placeholder?: string;
}

interface ModulePageProps {
  title: string;
  subtitle?: string;
  listKey: string;
  icon?: ComponentType<{ className?: string }>;
  fields?: ModuleField[];
  addLabel?: string;
}

const EMPTY_ITEMS: ListItem[] = [];

const DEFAULT_FIELDS: ModuleField[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Enter a name" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional details" },
];

const readField = (it: ListItem, key: string): string => {
  if (key === "name") return it.name ?? "";
  if (key === "description") return it.description ?? "";
  return String((it.meta ?? {})[key] ?? "");
};

export function ModulePage({
  title,
  subtitle,
  listKey,
  icon: Icon,
  fields = DEFAULT_FIELDS,
  addLabel = "New entry",
}: ModulePageProps) {
  const items = useCRM((s) => s.lists[listKey]) ?? EMPTY_ITEMS;
  const addListItem = useCRM((s) => s.addListItem);
  const updateListItem = useCRM((s) => s.updateListItem);
  const deleteListItem = useCRM((s) => s.deleteListItem);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [form, setForm] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const statusField = fields.find((f) => f.key === "status" && f.type === "select");
  const amountField = fields.find((f) => f.type === "number" && ["amount", "price", "value", "total"].includes(f.key));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (statusField && statusFilter && readField(it, "status") !== statusFilter) return false;
      if (!q) return true;
      return [it.name, it.description, ...Object.values(it.meta ?? {})]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, query, statusFilter, statusField]);

  const stats = useMemo(() => {
    const total = items.length;
    let sum = 0;
    const byStatus: Record<string, number> = {};
    items.forEach((it) => {
      if (amountField) sum += Number(readField(it, amountField.key)) || 0;
      if (statusField) {
        const s = readField(it, "status") || "—";
        byStatus[s] = (byStatus[s] ?? 0) + 1;
      }
    });
    return { total, sum, byStatus };
  }, [items, amountField, statusField]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((it) => selected[it.id]);
  const toggleSelect = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelected({});
    else {
      const next: Record<string, boolean> = {};
      filtered.forEach((it) => { next[it.id] = true; });
      setSelected(next);
    }
  };

  const openNew = () => {
    setEditing(null);
    const blank: Record<string, string> = {};
    fields.forEach((f) => (blank[f.key] = ""));
    setForm(blank);
    setMode("edit");
  };

  const openEdit = (it: ListItem) => {
    setEditing(it);
    const seed: Record<string, string> = {};
    fields.forEach((f) => { seed[f.key] = readField(it, f.key); });
    setForm(seed);
    setMode("edit");
  };

  const save = () => {
    if (!form.name?.trim()) return;
    const meta: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.key !== "name" && f.key !== "description" && form[f.key] !== "")
        meta[f.key] = form[f.key];
    });
    if (editing) {
      updateListItem(listKey, editing.id, { name: form.name, description: form.description || undefined, meta });
    } else {
      addListItem(listKey, { name: form.name, description: form.description || undefined, meta });
    }
    setMode("list");
    setEditing(null);
  };

  const exportJSON = (list: ListItem[]) => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${listKey}-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV = (list: ListItem[]) => {
    const headers = fields.map((f) => f.key);
    const rows = list.map((it) => headers.map((h) => JSON.stringify(readField(it, h))).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${listKey}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const [head, ...rest] = text.split(/\r?\n/).filter(Boolean);
        const hs = head.split(",").map((h) => h.trim());
        rows = rest.map((line) => {
          const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) =>
            c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
          const o: any = {};
          hs.forEach((h, i) => { o[h] = cells[i] ?? ""; });
          return o;
        });
      } else {
        rows = JSON.parse(text);
      }
      let count = 0;
      rows.forEach((r) => {
        const name = r.name ?? r.title;
        if (!name) return;
        const meta: Record<string, any> = {};
        fields.forEach((f) => {
          if (f.key !== "name" && f.key !== "description" && r[f.key] !== undefined && r[f.key] !== "") meta[f.key] = String(r[f.key]);
        });
        // if importing our own JSON export, meta may already be present
        if (r.meta && typeof r.meta === "object") Object.assign(meta, r.meta);
        addListItem(listKey, {
          name: String(name),
          description: r.description || undefined,
          meta,
        });
        count++;
      });
      alert(`Imported ${count} record(s).`);
    } catch (e) {
      alert("Import failed. Please upload a valid JSON or CSV file.");
    }
  };

  if (mode === "edit") {
    return (
      <div className="space-y-6">
        <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode("list")}
              className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/20"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">{title}</div>
              <h2 className="text-lg font-black" style={{ color: "#2A1418" }}>
                {editing ? "Edit entry" : addLabel}
              </h2>
            </div>
          </div>
          <button
            onClick={save}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] transition hover:-translate-y-0.5"
          >
            <Save className="h-4 w-4" /> {editing ? "Save changes" : "Create"}
          </button>
        </div>

        <div className="widget-card p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((f) => {
              const wide = f.type === "textarea";
              return (
                <div key={f.key} className={wide ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-primary">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="widget-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-black" style={{ color: "#2A1418" }}>{title}</h2>
            {subtitle && <p className="text-xs" style={{ color: "#7A6870" }}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="glass-chip w-56 rounded-2xl py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {statusField && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-chip rounded-2xl px-3 py-2.5 text-sm"
            >
              <option value="">All statuses</option>
              {statusField.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button
            onClick={() => exportJSON(filtered)}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={ListChecks} label="Total" value={String(stats.total)} />
        {amountField && (
          <StatCard icon={DollarSign} label={`Sum · ${amountField.label}`} value={stats.sum.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
        )}
        {statusField && statusField.options?.slice(0, amountField ? 2 : 3).map((o) => (
          <StatCard key={o} icon={BarChart3} label={o} value={String(stats.byStatus[o] ?? 0)} />
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="widget-card flex flex-wrap items-center gap-3 p-4">
          <div className="text-sm font-bold text-primary">{selectedIds.length} selected</div>
          <button onClick={toggleSelectAll} className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10">
            {allFilteredSelected ? "Unselect all" : "Select all filtered"}
          </button>
          <button
            onClick={() => exportJSON(items.filter((it) => selected[it.id]))}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <Download className="h-3.5 w-3.5" /> Export selected
          </button>
          {statusField && (
            <select
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                selectedIds.forEach((id) => {
                  const it = items.find((x) => x.id === id);
                  if (it) updateListItem(listKey, id, { meta: { ...(it.meta ?? {}), status: v } });
                });
                e.target.value = "";
              }}
              className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold text-primary"
            >
              <option value="">Change status…</option>
              {statusField.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.length} item(s)?`)) {
                selectedIds.forEach((id) => deleteListItem(listKey, id));
                setSelected({});
              }
            }}
            className="ml-auto flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white hover:-translate-y-0.5 transition"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete selected
          </button>
        </div>
      )}

      <div className="widget-card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              {Icon ? <Icon className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
            </div>
            <div className="text-sm font-black" style={{ color: "#2A1418" }}>
              {query || statusFilter ? "No matches" : `No ${title.toLowerCase()} yet`}
            </div>
            <div className="mt-1 text-xs" style={{ color: "#7A6870" }}>
              {query || statusFilter ? "Try another search or filter." : `Click "${addLabel}" to add your first entry.`}
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-primary">
                <th className="px-5 py-3 w-8">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} />
                </th>
                {fields.map((f) => (
                  <th key={f.key} className="px-5 py-3">{f.label}</th>
                ))}
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-t border-black/5 hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <input type="checkbox" checked={!!selected[it.id]} onChange={() => toggleSelect(it.id)} />
                  </td>
                  {fields.map((f) => {
                    const val = readField(it, f.key);
                    return (
                      <td key={f.key} className="px-5 py-3 align-top">
                        <span className={f.key === "name" ? "font-bold text-[#2A1418]" : "text-[#4A3A40]"}>
                          {val ? String(val) : <span className="text-black/30">—</span>}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(it)}
                        className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this entry?")) deleteListItem(listKey, it.id); }}
                        className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="widget-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-widest text-primary">{label}</div>
          <div className="text-xl font-black" style={{ color: "#2A1418" }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
