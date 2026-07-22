import { createFileRoute } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Subscriptions"
      subtitle="Recurring plans and retainers per client."
      listKey="subscriptions"
      icon={Repeat}
      addLabel="New subscription"
      fields={[
        { key: "name", label: "Plan name" },
        { key: "client", label: "Client" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "cycle", label: "Billing cycle", type: "select", options: ["Weekly", "Monthly", "Quarterly", "Yearly"] },
        { key: "nextBilling", label: "Next billing", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["Active", "Paused", "Cancelled"] },
      ]}
    />
  ),
});