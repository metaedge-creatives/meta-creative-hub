import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Expenses"
      subtitle="Track business expenses and reimbursables."
      listKey="expenses"
      icon={Wallet}
      addLabel="New expense"
      fields={[
        { key: "name", label: "Description" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", type: "number" },
        { key: "date", label: "Date", type: "date" },
        { key: "project", label: "Project" },
        { key: "description", label: "Notes", type: "textarea" },
      ]}
    />
  ),
});