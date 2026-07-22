import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/user-roles")({
  head: () => ({ meta: [{ title: "User Roles · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="User Roles"
      subtitle="Define roles and access levels for your team."
      listKey="user_roles"
      icon={Shield}
      addLabel="New role"
      fields={[
        { key: "name", label: "Role name" },
        { key: "scope", label: "Scope", type: "select", options: ["Global", "Module-scoped", "Read-only"] },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  ),
});