import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/crm/ComingSoon";

export const Route = createFileRoute("/sales/invoices")({
  head: () => ({ meta: [{ title: "Invoices · MetaEdge CRM" }] }),
  component: () => (
    <ComingSoon
      title="Invoices"
      subtitle="Send branded invoices, track payments and chase overdue balances automatically."
      features={[
        { title: "Branded PDFs", body: "MetaEdge-styled invoices generated from deals with one click." },
        { title: "Pay online", body: "Optional Stripe / bank-transfer links with automatic reconciliation." },
        { title: "Smart reminders", body: "Automatic dunning emails at 7, 14 and 30 days overdue." },
      ]}
    />
  ),
});