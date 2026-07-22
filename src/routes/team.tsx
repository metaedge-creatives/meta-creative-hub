import { createFileRoute, Link } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { initials } from "@/lib/crm/hooks";
import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team · MetaEdge CRM" }] }),
  component: TeamPage,
});

function TeamPage() {
  const users = useCRM((s) => s.users);
  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Everyone with access to the MetaEdge workspace."
        actions={
          <Link to="/settings">
            <Button className="font-bold">Manage in Settings</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="group relative overflow-hidden rounded-2xl border border-divider bg-card p-5 brand-shadow transition hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="h-1 -mx-5 -mt-5 mb-4 bg-primary" />
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-black text-primary">
                {initials(u.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">{u.name}</div>
                <div className="truncate text-[11px]" style={{ color: "#999" }}>
                  {u.jobTitle || "Team member"}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-[12px]" style={{ color: "#666" }}>
              <div>{u.email}</div>
              {u.phone && <div>{u.phone}</div>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              {u.isSuperAdmin ? (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">
                  Super admin
                </span>
              ) : (
                <span className="rounded-full border border-divider px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Member
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}