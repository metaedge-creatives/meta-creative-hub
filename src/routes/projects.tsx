import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { PageHeader, TagPill } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download, Upload, Search, Filter, FolderKanban, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { ExportMenu } from "@/components/crm/ExportMenu";

const STATUSES = ["brief", "in_progress", "review", "delivered"] as const;
type Status = typeof STATUSES[number];

function NewProjectLink() {
  return (
    <Link to="/projects/new">
      <NewButton>New Project</NewButton>
    </Link>
  );
}

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects · MetaEdge Creatives CRM" },
      { name: "description", content: "Every creative project you're running." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const can = useCan("projects");
  const projects = useCRM((s) => s.projects);
  const companies = useCRM((s) => s.companies);
  const contacts = useCRM((s) => s.contacts);
  const addProject = useCRM((s) => s.addProject);
  const updateProject = useCRM((s) => s.updateProject);
  const deleteProject = useCRM((s) => s.deleteProject);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return projects.filter((p) => {
      const hay = `${p.name} ${p.brief ?? ""}`.toLowerCase();
      const matchesQ = hay.includes(needle);
      const matchesS = status === "all" || p.status === status;
      const matchesC = companyId === "all" || p.companyId === companyId;
      return matchesQ && matchesS && matchesC;
    });
  }, [projects, q, status, companyId]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: projects.length,
      inProgress: projects.filter((p) => p.status === "in_progress").length,
      delivered: projects.filter((p) => p.status === "delivered").length,
      overdue: projects.filter((p) => p.deadline && p.deadline < today && p.status !== "delivered").length,
    };
  }, [projects]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const PROJECT_COLS = [
    { key: "name", label: "Name" },
    { key: "brief", label: "Brief" },
    { key: "status", label: "Status" },
    { key: "deadline", label: "Deadline" },
    { key: "companyId", label: "Company" },
    { key: "contactId", label: "Contact" },
    { key: "tags", label: "Tags" },
    { key: "createdAt", label: "Created" },
  ];

  const importProjects = async (file: File) => {
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const o: any = {};
          headers.forEach((h, i) => (o[h] = cols[i]?.trim()));
          return o;
        });
      }
      let count = 0;
      for (const r of rows) {
        if (!r.name) continue;
        addProject({
          name: r.name,
          brief: r.brief,
          companyId: r.companyId,
          contactId: r.contactId,
          status: (STATUSES as readonly string[]).includes(r.status) ? r.status : "brief",
          deadline: r.deadline,
          tags: Array.isArray(r.tags) ? r.tags : [],
        } as any);
        count++;
      }
      alert(`Imported ${count} project${count === 1 ? "" : "s"}.`);
    } catch (e) {
      alert("Import failed: " + (e instanceof Error ? e.message : "invalid file"));
    }
  };

  if (!can) return <NoAccess module="Projects" />;

  return (
    <div>
      <PageHeader
        title="Creative Projects"
        subtitle={`${projects.length} in flight`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="font-bold">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportProjects()} className="font-bold">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importProjects(f); e.target.value = ""; }}
            />
            <NewProjectLink />
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<FolderKanban className="h-4 w-4" />} label="Total" value={stats.total} />
        <StatTile icon={<Clock className="h-4 w-4" />} label="In Progress" value={stats.inProgress} />
        <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Delivered" value={stats.delivered} />
        <StatTile icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={stats.overdue} />
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#999" }} />
          <Input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)} className="font-bold">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
      </div>

      {showFilter && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-divider bg-card p-4">
          <div className="min-w-[180px]">
            <Label className="mb-1 block">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[220px]">
            <Label className="mb-1 block">Client</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(status !== "all" || companyId !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setStatus("all"); setCompanyId("all"); }}>
              Clear
            </Button>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Spin up a project once a deal closes or straight from a client."
          action={<NewProjectLink />}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-divider bg-card p-8 text-center text-sm" style={{ color: "#666" }}>
          No projects match your filters.
        </div>
      ) : (
        <>
          {/* Bulk action bar */}
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-divider bg-card p-3">
            <label className="flex items-center gap-2 text-xs font-bold">
              <Checkbox
                checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
                onCheckedChange={(v) => {
                  if (v) setSelected(new Set(filtered.map((p) => p.id)));
                  else setSelected(new Set());
                }}
              />
              Select all
            </label>
            <span className="text-xs" style={{ color: "#666" }}>{selected.size} selected</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => exportProjects(projects.filter((p) => selected.has(p.id)))}
                className="font-bold"
              >
                <Download className="h-3.5 w-3.5" /> Export selected
              </Button>
              <Select
                value={bulkStatus}
                onValueChange={(v) => {
                  setBulkStatus(v);
                  selected.forEach((id) => updateProject(id, { status: v as Status }));
                  setBulkStatus("");
                }}
              >
                <SelectTrigger className="h-8 w-[170px] text-xs" disabled={selected.size === 0}>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline" size="sm" disabled={selected.size === 0}
                onClick={() => {
                  if (!confirm(`Delete ${selected.size} project${selected.size === 1 ? "" : "s"}?`)) return;
                  selected.forEach((id) => deleteProject(id));
                  setSelected(new Set());
                }}
                className="font-bold text-primary"
              >
                Delete selected
              </Button>
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-divider bg-card brand-shadow">
            <table className="w-full text-sm">
              <thead className="border-b border-divider bg-muted/40 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#666" }}>
                <tr>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-4 py-3 text-left font-bold">Name</th>
                  <th className="px-4 py-3 text-left font-bold">Client</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Deadline</th>
                  <th className="px-4 py-3 text-left font-bold">Deliverables</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const co = companies.find((c) => c.id === p.companyId);
                  const ct = contacts.find((c) => c.id === p.contactId);
                  const done = p.deliverables.filter((d) => d.done).length;
                  return (
                    <tr key={p.id} className="border-b border-divider last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-3">
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/projects/$id" params={{ id: p.id }} className="font-extrabold hover:text-primary">{p.name}</Link>
                        {p.brief && <div className="text-[11px]" style={{ color: "#999" }}>{p.brief.slice(0, 80)}</div>}
                      </td>
                      <td className="px-4 py-3">{co?.name || ct?.name || <span style={{ color: "#999" }}>—</span>}</td>
                      <td className="px-4 py-3"><TagPill>{p.status.replace("_", " ")}</TagPill></td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "#666" }}>{formatDate(p.deadline)}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "#666" }}>{done}/{p.deliverables.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-divider bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
        {icon} {label}
      </div>
      <div className="mt-1.5 text-2xl font-black">{value}</div>
    </div>
  );
}
