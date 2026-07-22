import { createFileRoute } from "@tanstack/react-router";
import { Percent } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/tax")({
  head: () => ({ meta: [{ title: "Tax · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Tax Rates"
      subtitle="Configure tax rates applied to invoices and estimates."
      listKey="tax_rates"
      icon={Percent}
      addLabel="New tax rate"
      fields={[
        { key: "name", label: "Tax name", placeholder: "e.g. GST" },
        { key: "rate", label: "Rate (%)", type: "number", placeholder: "e.g. 18" },
        { key: "region", label: "Region" },
        { key: "description", label: "Notes", type: "textarea" },
      ]}
    />
  ),
});