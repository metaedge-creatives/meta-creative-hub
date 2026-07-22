import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser, formatCurrency, formatDate } from "@/lib/crm/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Check, X } from "lucide-react";

export const Route = createFileRoute("/portal/proposals")({
  head: () => ({ meta: [{ title: "Proposals · Client Portal" }] }),
  component: PortalProposals,
});

function PortalProposals() {
  const client = useCurrentClientUser();
  const proposals = useCRM((s) => s.proposals);
  const setStatus = useCRM((s) => s.setProposalStatus);
  const [q, setQ] = useState("");

  const mine = useMemo(() => {
    if (!client) return [];
    const cn = client.name.toLowerCase();
    const cc = (client.companyName || "").toLowerCase();
    return proposals.filter((p) => {
      const n = p.clientName.toLowerCase();
      return n === cn || (!!cc && n === cc);
    });
  }, [client, proposals]);

  const filtered = mine.filter((p) => q === "" || p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Proposals</div>
          <div className="text-xs" style={{ color: "#777" }}>Review and accept proposals from the team.</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search proposals" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-10 text-center text-sm" style={{ color: "#888" }}>
          <FileText className="mx-auto mb-3 h-6 w-6 text-primary" />
          No proposals to show. If you sent a service request, it'll appear here as a proposal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((p) => {
            const isSent = p.status === "sent" || p.status === "viewed";
            return (
              <div key={p.id} className="rounded-2xl border border-divider bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-black">{p.title}</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "#888" }}>{formatDate(p.createdAt)}</div>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{p.status}</span>
                </div>
                <div className="mt-3 text-2xl font-black">{formatCurrency(p.value)}</div>
                {p.content && <p className="mt-2 line-clamp-3 text-[12px]" style={{ color: "#666" }}>{p.content}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isSent && (
                    <>
                      <Button size="sm" onClick={() => setStatus(p.id, "accepted")}><Check className="h-3.5 w-3.5" /> Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}><X className="h-3.5 w-3.5" /> Decline</Button>
                    </>
                  )}
                  {p.status === "accepted" && <div className="text-[12px] font-black text-primary">Accepted ✓</div>}
                  {p.status === "rejected" && <div className="text-[12px] font-black text-muted-foreground">Declined</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
