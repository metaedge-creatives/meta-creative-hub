import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatCurrency, formatDate } from "@/lib/crm/hooks";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NotesPanel, TasksPanel } from "@/components/crm/NotesPanel";
import { Field, RelatedList } from "@/routes/contacts.$id";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/deals/$id")({
  head: () => ({ meta: [{ title: "Deal · MetaEdge Creatives CRM" }] }),
  component: DealDetail,
});

function DealDetail() {
  const { id } = Route.useParams();
  const can = useCan("deals");
  const navigate = useNavigate();
  const deal = useCRM((s) => s.deals.find((d) => d.id === id));
  const company = useCRM((s) => s.companies.find((c) => c.id === deal?.companyId));
  const contact = useCRM((s) => s.contacts.find((c) => c.id === deal?.contactId));
  const owner = useCRM((s) => s.users.find((u) => u.id === deal?.ownerId));
  const projects = useCRM((s) => s.projects.filter((p) => p.dealId === id));
  const moveDealStage = useCRM((s) => s.moveDealStage);
  const deleteDeal = useCRM((s) => s.deleteDeal);

  if (!can) return <NoAccess module="Deals" />;
  if (!deal) return <div className="text-sm" style={{ color: "#999" }}>Deal not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        subtitle={formatCurrency(deal.value)}
        actions={
          <Button variant="outline" onClick={() => { deleteDeal(deal.id); navigate({ to: "/deals" }); }} className="font-bold">
            Delete
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-divider bg-card brand-shadow p-6 space-y-3">
          <div className="h-1 -mt-6 -mx-6 mb-4 rounded-t-xl bg-primary" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>Stage</div>
            <Select value={deal.stage} onValueChange={(v) => moveDealStage(deal.id, v as DealStage)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Value" value={formatCurrency(deal.value)} />
          <Field label="Expected Close" value={formatDate(deal.expectedClose)} />
          <Field label="Owner" value={owner?.name} />
          <Field
            label="Company"
            value={company ? <Link to="/companies/$id" params={{ id: company.id }} className="text-primary font-semibold">{company.name}</Link> : "—"}
          />
          <Field
            label="Contact"
            value={contact ? <Link to="/contacts/$id" params={{ id: contact.id }} className="text-primary font-semibold">{contact.name}</Link> : "—"}
          />
          {deal.notes && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>Notes</div>
              <p className="text-sm" style={{ color: "#666" }}>{deal.notes}</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <RelatedList title="Projects from this deal" empty="No projects yet.">
            {projects.map((p) => (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="flex items-center justify-between rounded-md border border-divider p-3 hover:bg-accent/40">
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs" style={{ color: "#999" }}>{p.status.replace("_", " ")}</span>
              </Link>
            ))}
          </RelatedList>
          <TasksPanel parentType="deal" parentId={deal.id} />
          <NotesPanel parentType="deal" parentId={deal.id} />
        </div>
      </div>
    </div>
  );
}