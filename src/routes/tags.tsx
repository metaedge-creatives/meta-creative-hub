import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/tags")({
  head: () => ({ meta: [{ title: "Tags · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Tags"
      subtitle="Reusable tags across contacts, deals, projects."
      listKey="tags"
      icon={Tag}
      addLabel="New tag"
      fields={[
        { key: "name", label: "Tag name" },
        { key: "color", label: "Color (hex)", placeholder: "#BF1833" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  ),
});