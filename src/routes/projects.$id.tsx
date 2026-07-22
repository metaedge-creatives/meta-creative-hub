import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NotesPanel, TasksPanel } from "@/components/crm/NotesPanel";
import { Field } from "@/routes/contacts.$id";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Project · MetaEdge Creatives CRM" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const can = useCan("projects");
  const navigate = useNavigate();
  const project = useCRM((s) => s.projects.find((p) => p.id === id));
  const company = useCRM((s) => s.companies.find((c) => c.id === project?.companyId));
  const contact = useCRM((s) => s.contacts.find((c) => c.id === project?.contactId));
  const deal = useCRM((s) => s.deals.find((d) => d.id === project?.dealId));
  const owner = useCRM((s) => s.users.find((u) => u.id === project?.ownerId));
  const setProjectStatus = useCRM((s) => s.setProjectStatus);
  const addDeliverable = useCRM((s) => s.addDeliverable);
  const toggleDeliverable = useCRM((s) => s.toggleDeliverable);
  const removeDeliverable = useCRM((s) => s.removeDeliverable);
  const deleteProject = useCRM((s) => s.deleteProject);
  const [newD, setNewD] = useState("");

  if (!can) return <NoAccess module="Projects" />;
  if (!project) return <div className="text-sm" style={{ color: "#999" }}>Project not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle={project.brief || undefined}
        actions={
          <Button variant="outline" onClick={() => { deleteProject(project.id); navigate({ to: "/projects" }); }} className="font-bold">
            Delete
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-divider bg-card brand-shadow p-6 space-y-3">
          <div className="h-1 -mt-6 -mx-6 mb-4 rounded-t-xl bg-primary" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999" }}>Status</div>
            <Select value={project.status} onValueChange={(v) => setProjectStatus(project.id, v as ProjectStatus)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Deadline" value={formatDate(project.deadline)} />
          <Field label="Owner" value={owner?.name} />
          <Field label="Company" value={company ? <Link to="/companies/$id" params={{ id: company.id }} className="text-primary font-semibold">{company.name}</Link> : "—"} />
          <Field label="Contact" value={contact ? <Link to="/contacts/$id" params={{ id: contact.id }} className="text-primary font-semibold">{contact.name}</Link> : "—"} />
          <Field label="From Deal" value={deal ? <Link to="/deals/$id" params={{ id: deal.id }} className="text-primary font-semibold">{deal.title}</Link> : "—"} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-divider bg-card brand-shadow p-6">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Deliverables</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newD.trim()) return;
                addDeliverable(project.id, newD.trim());
                setNewD("");
              }}
              className="flex gap-2"
            >
              <input
                value={newD}
                onChange={(e) => setNewD(e.target.value)}
                placeholder="Add a deliverable"
                className="flex-1 rounded-md border border-divider bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button type="submit" className="font-bold">Add</Button>
            </form>
            <ul className="mt-4 space-y-1.5">
              {project.deliverables.length === 0 && (
                <li className="text-sm" style={{ color: "#999" }}>No deliverables yet.</li>
              )}
              {project.deliverables.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-md border border-divider px-3 py-2">
                  <input
                    type="checkbox"
                    checked={d.done}
                    onChange={() => toggleDeliverable(project.id, d.id)}
                    className="h-4 w-4 accent-[--maroon]"
                  />
                  <span className={`flex-1 text-sm ${d.done ? "line-through" : ""}`} style={d.done ? { color: "#999" } : undefined}>
                    {d.title}
                  </span>
                  <button
                    onClick={() => removeDeliverable(project.id, d.id)}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <TasksPanel parentType="project" parentId={project.id} />
          <NotesPanel parentType="project" parentId={project.id} />
        </div>
      </div>
    </div>
  );
}