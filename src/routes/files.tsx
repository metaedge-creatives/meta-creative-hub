import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/files")({
  head: () => ({ meta: [{ title: "Files · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Files"
      subtitle="Central library for assets, briefs, and deliverables."
      listKey="files"
      icon={FolderOpen}
      addLabel="New file"
      fields={[
        { key: "name", label: "File name" },
        { key: "folder", label: "Folder" },
        { key: "url", label: "Link / URL", placeholder: "https://…" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  ),
});