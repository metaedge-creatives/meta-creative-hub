import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatCurrency, formatDate } from "@/lib/crm/hooks";
import type { Contract } from "@/lib/crm/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollText, Search, Download, PenLine } from "lucide-react";

export const Route = createFileRoute("/portal/contracts")({
  head: () => ({ meta: [{ title: "Contracts · Client Portal" }] }),
  component: PortalContracts,
});

const EMPTY: Contract[] = [];

function PortalContracts() {
  const client = useCurrentClientUser();
  const contracts = useCRM((s) => s.contracts) ?? EMPTY;
  const updateContract = useCRM((s) => s.updateContract);
  const [q, setQ] = useState("");

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return contracts.filter(
      (c) => c.clientName.toLowerCase() === cn || (cc && c.clientName.toLowerCase() === cc),
    );
  }, [client, contracts]);

  const filtered = mine.filter((c) => q === "" || c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Contracts</div>
          <div className="text-xs" style={{ color: "#777" }}>Review and sign contracts.</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contracts" className="pl-9" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-divider p-8 text-center text-sm" style={{ color: "#888" }}>
            No contracts to display.
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="rounded-2xl border border-divider bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-base font-black">{c.title}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {c.startDate ? formatDate(c.startDate) : "—"} → {c.endDate ? formatDate(c.endDate) : "—"}
                </div>
              </div>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{c.status}</span>
            </div>
            <div className="mt-3 text-2xl font-black">{formatCurrency(c.value)}</div>
            {c.notes && <div className="mt-2 line-clamp-3 text-xs" style={{ color: "#666" }}>{c.notes}</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {c.status === "sent" && (
                <Button
                  size="sm"
                  onClick={() => updateContract(c.id, { status: "signed" })}
                >
                  <PenLine className="h-3.5 w-3.5" /> Sign contract
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
