import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatDate } from "@/lib/crm/hooks";
import type { Project } from "@/lib/crm/types";
import { FolderKanban, Calendar, CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/portal/projects")({
  head: () => ({ meta: [{ title: "Projects · Client Portal" }] }),
  component: PortalProjects,
});

function projectProgress(p: Project) {
  if (typeof p.progress === "number") return Math.max(0, Math.min(100, p.progress));
  const total = p.deliverables?.length ?? 0;
  if (!total) {
    const map: Record<string, number> = { brief: 10, in_progress: 45, review: 80, delivered: 100 };
    return map[p.status] ?? 0;
  }
  const done = p.deliverables.filter((d) => d.done).length;
  return Math.round((done / total) * 100);
}

function PortalProjects() {
  const client = useCurrentClientUser();
  const projects = useCRM((s) => s.projects);
  const companies = useCRM((s) => s.companies);

  const mine = useMemo(() => {
    if (!client) return [] as Project[];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    const companyIds = new Set(
      companies
        .filter((c) => c.name.toLowerCase() === cn || (cc && c.name.toLowerCase() === cc))
        .map((c) => c.id),
    );
    return projects.filter((p) => (p.companyId && companyIds.has(p.companyId)));
  }, [client, projects, companies]);

  return (
    <div className="space-y-6">
      <Header title="My Projects" subtitle="Live progress on everything we're building for you." icon={FolderKanban} />

      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-10 text-center text-sm" style={{ color: "#888" }}>
          <FolderKanban className="mx-auto mb-3 h-6 w-6 text-primary" />
          No projects assigned yet. Once your project starts you'll see live progress here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mine.map((p) => {
            const pct = projectProgress(p);
            const done = p.deliverables.filter((d) => d.done).length;
            return (
              <div key={p.id} className="rounded-2xl border border-divider bg-white p-5 brand-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-black">{p.name}</div>
                    {p.brief && <div className="mt-0.5 line-clamp-2 text-[12px]" style={{ color: "#777" }}>{p.brief}</div>}
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                    {p.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold" style={{ color: "#555" }}>Progress</span>
                    <span className="font-black text-primary">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-[11px]" style={{ color: "#666" }}>
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.deadline)}</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {done}/{p.deliverables.length} deliverables</span>
                </div>

                {p.deliverables.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {p.deliverables.slice(0, 4).map((d) => (
                      <li key={d.id} className="flex items-center gap-2 text-[12px]">
                        <span className={"flex h-4 w-4 items-center justify-center rounded-full " + (d.done ? "bg-primary text-white" : "bg-muted text-transparent")}>
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                        <span className={d.done ? "line-through text-muted-foreground" : ""}>{d.title}</span>
                      </li>
                    ))}
                    {p.deliverables.length > 4 && (
                      <li className="text-[11px]" style={{ color: "#999" }}>+ {p.deliverables.length - 4} more…</li>
                    )}
                  </ul>
                )}

                <div className="mt-4 flex justify-end">
                  <Link
                    to="/portal/reports"
                    className="inline-flex items-center gap-1 text-[12px] font-black text-primary hover:underline"
                  >
                    View reports <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
