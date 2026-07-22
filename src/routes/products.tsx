import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ModulePage } from "@/components/crm/ModulePage";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products · MetaEdge CRM" }] }),
  component: () => (
    <ModulePage
      title="Products & Services"
      subtitle="Catalog of services and products you sell."
      listKey="products"
      icon={Package}
      addLabel="New item"
      fields={[
        { key: "name", label: "Item name" },
        { key: "category", label: "Category" },
        { key: "unit", label: "Unit", placeholder: "hour, project, month…" },
        { key: "price", label: "Price", type: "number", placeholder: "0.00" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  ),
});