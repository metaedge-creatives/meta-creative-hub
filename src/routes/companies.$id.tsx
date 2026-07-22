import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { PageHeader, TagPill } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NotesPanel, TasksPanel } from "@/components/crm/NotesPanel";
import { Field, RelatedList } from "@/routes/contacts.$id";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/companies/$id")({
  head: () => ({ meta: [{ title: "Company · MetaEdge Creatives CRM" }] }),
  component: CompanyDetail,
});

function CompanyDetail() {
  const { id } = Route.useParams();
  const can = useCan("contacts");
  const navigate = useNavigate();
  const company = useCRM((s) => s.companies.find((c) => c.id === id));
  const contacts = useCRM((s) => s.contacts.filter((c) => c.companyId === id));
  const deals = useCRM((s) => s.deals.filter((d) => d.companyId === id));
  const projects = useCRM((s) => s.projects.filter((p) => p.companyId === id));
  const deleteCompany = useCRM((s) => s.deleteCompany);

  if (!can) return <NoAccess module="Contacts" />;
  if (!company) return <div className="text-sm" style={{ color: "#999" }}>Company not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        subtitle={company.industry || undefined}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              deleteCompany(company.id);
              navigate({ to: "/contacts" });
            }}
            className="font-bold"
          >
            Delete
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-divider bg-card brand-shadow p-6 space-y-3">
          <div className="h-1 -mt-6 -mx-6 mb-4 rounded-t-xl bg-primary" />
          <Field label="Website" value={company.website} />
          <Field label="Industry" value={company.industry} />
          <Field label="Added" value={formatDate(company.createdAt)} />
          {company.notes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>Notes</div>
              <p className="text-sm" style={{ color: "#666" }}>{company.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <RelatedList title="Contacts" empty="No contacts at this company.">
            {contacts.map((c) => (
              <Link key={c.id} to="/contacts/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs" style={{ color: "#999" }}>{c.title || c.email}</span>
              </Link>
            ))}
          </RelatedList>
          <RelatedList title="Deals" empty="No deals with this company.">
            {deals.map((d) => (
              <Link key={d.id} to="/deals/$id" params={{ id: d.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{d.title}</span>
                <TagPill>{d.stage}</TagPill>
              </Link>
            ))}
          </RelatedList>
          <RelatedList title="Projects" empty="No projects.">
            {projects.map((p) => (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{p.name}</span>
                <TagPill>{p.status.replace("_", " ")}</TagPill>
              </Link>
            ))}
          </RelatedList>
          <TasksPanel parentType="company" parentId={company.id} />
          <NotesPanel parentType="company" parentId={company.id} />
        </div>
      </div>
    </div>
  );
}