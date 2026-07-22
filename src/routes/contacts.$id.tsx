import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { PageHeader, TagPill } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NotesPanel, TasksPanel } from "@/components/crm/NotesPanel";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contacts/$id")({
  head: () => ({ meta: [{ title: "Contact · MetaEdge Creatives CRM" }] }),
  component: ContactDetail,
});

function ContactDetail() {
  const { id } = Route.useParams();
  const can = useCan("contacts");
  const navigate = useNavigate();
  const contact = useCRM((s) => s.contacts.find((c) => c.id === id));
  const company = useCRM((s) => s.companies.find((c) => c.id === contact?.companyId));
  const deals = useCRM((s) => s.deals.filter((d) => d.contactId === id));
  const projects = useCRM((s) => s.projects.filter((p) => p.contactId === id));
  const deleteContact = useCRM((s) => s.deleteContact);

  if (!can) return <NoAccess module="Contacts" />;
  if (!contact) return <div className="text-sm" style={{ color: "#999" }}>Contact not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.name}
        subtitle={contact.title || undefined}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              deleteContact(contact.id);
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
          <Field label="Email" value={contact.email} />
          <Field label="Phone" value={contact.phone} />
          <Field
            label="Company"
            value={
              company ? (
                <Link to="/companies/$id" params={{ id: company.id }} className="text-primary font-semibold">
                  {company.name}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Field label="Added" value={formatDate(contact.createdAt)} />
          {contact.notes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>Notes</div>
              <p className="text-sm" style={{ color: "#666" }}>{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <RelatedList title="Deals" empty="No deals linked yet.">
            {deals.map((d) => (
              <Link key={d.id} to="/deals/$id" params={{ id: d.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{d.title}</span>
                <TagPill>{d.stage}</TagPill>
              </Link>
            ))}
          </RelatedList>
          <RelatedList title="Projects" empty="No projects yet.">
            {projects.map((p) => (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{p.name}</span>
                <TagPill>{p.status.replace("_", " ")}</TagPill>
              </Link>
            ))}
          </RelatedList>
          <TasksPanel parentType="contact" parentId={contact.id} />
          <NotesPanel parentType="contact" parentId={contact.id} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>{label}</div>
      <div className="text-sm font-semibold">{value || <span style={{ color: "#999" }}>—</span>}</div>
    </div>
  );
}

function RelatedList({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasChildren = items.filter(Boolean).length > 0;
  return (
    <div className="rounded-xl border border-divider bg-card brand-shadow p-6">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{title}</div>
      {hasChildren ? <div className="space-y-2">{children}</div> : <p className="text-sm" style={{ color: "#999" }}>{empty}</p>}
    </div>
  );
}

export { Field, RelatedList };