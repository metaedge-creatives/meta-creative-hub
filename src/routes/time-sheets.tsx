import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/time-sheets")({
  head: () => ({ meta: [{ title: "Time Sheets · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Time Sheets"
      subtitle="Log billable hours across projects and clients."
      listKey="timesheets"
      icon={Clock}
      addLabel="Log time"
      fields={[
        { key: "name", label: "Title", placeholder: "What did you work on?" },
        { key: "project", label: "Project", placeholder: "Related project" },
        { key: "hours", label: "Hours", type: "number", placeholder: "e.g. 2.5" },
        { key: "date", label: "Date", type: "date" },
        { key: "description", label: "Notes", type: "textarea" },
      ]}
    />
  ),
});