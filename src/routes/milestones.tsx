import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/milestones")({
  head: () => ({ meta: [{ title: "Milestones · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Milestones"
      subtitle="Track key deliverables and phases across engagements."
      listKey="milestones"
      icon={Flag}
      addLabel="New milestone"
      fields={[
        { key: "name", label: "Milestone" },
        { key: "project", label: "Project" },
        { key: "dueDate", label: "Due date", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["Planned", "In progress", "Completed", "Blocked"] },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  ),
});