import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layers, Send, CheckCircle2, Search, MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/portal/services")({
  head: () => ({ meta: [{ title: "Services · Client Portal" }] }),
  component: PortalServices,
});

function PortalServices() {
  const client = useCurrentClientUser();
  const products = useCRM((s) => s.getList("products"));
  const addServiceRequest = useCRM((s) => s.addServiceRequest);
  const myRequests = useCRM((s) => s.serviceRequests);

  const [q, setQ] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", budget: "" });
  const [sent, setSent] = useState<string | null>(null);

  const catalog = useMemo(() => {
    if (products.length > 0) return products;
    // Fallback catalog so the page is never empty for the client.
    return DEFAULT_SERVICES.map((s) => ({
      id: `default-${s.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: s.name,
      description: s.description,
      meta: { category: s.category, price: s.price, unit: s.unit },
    })) as any[];
  }, [products]);

  const services = useMemo(
    () => catalog.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase())),
    [catalog, q],
  );


  const mine = useMemo(() => {
    if (!client) return [];
    return myRequests.filter((r) => r.clientUserId === client.id);
  }, [client, myRequests]);

  const requestFromProduct = (id: string) => {
    setSelected(id);
    const p = products.find((x) => x.id === id);
    setForm({ title: p ? `Book: ${p.name}` : "", description: p?.description ?? "", budget: String(p?.meta?.price ?? "") });
    setCustomOpen(true);
  };

  const submit = () => {
    if (!client) return;
    if (!form.title.trim()) return;
    const req = addServiceRequest({
      clientUserId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      productId: selected ?? undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      budget: form.budget ? Number(form.budget) : undefined,
    });
    setSent(req.id);
    setForm({ title: "", description: "", budget: "" });
    setSelected(null);
    setTimeout(() => { setCustomOpen(false); setSent(null); }, 1400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Services</div>
          <div className="text-xs" style={{ color: "#777" }}>Browse services or send a custom brief — we'll reply with a proposal.</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services" className="pl-9" />
        </div>
        <Button onClick={() => { setSelected(null); setForm({ title: "", description: "", budget: "" }); setCustomOpen(true); }} className="font-bold">
          <MessageSquarePlus className="h-4 w-4" /> Request custom brief
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-divider bg-white p-10 text-center text-sm" style={{ color: "#888" }}>
          <Layers className="mx-auto mb-3 h-6 w-6 text-primary" />
          No services listed yet. Send us a custom brief and we'll craft a proposal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-divider bg-white p-5">
              <div className="text-base font-black">{s.name}</div>
              {s.meta?.category && (
                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-primary">{s.meta.category}</div>
              )}
              {s.description && <p className="mt-2 line-clamp-3 text-[12px]" style={{ color: "#666" }}>{s.description}</p>}
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="text-lg font-black">
                  {s.meta?.price ? `$${Number(s.meta.price).toLocaleString()}` : <span className="text-xs text-muted-foreground">Custom quote</span>}
                  {s.meta?.unit && <span className="text-[11px] font-bold text-muted-foreground"> / {s.meta.unit}</span>}
                </div>
                <Button size="sm" onClick={() => requestFromProduct(s.id)}><Send className="h-3.5 w-3.5" /> Request</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mine.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">Your requests</div>
          <div className="space-y-2">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-divider bg-white p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-black">{r.title}</div>
                  <div className="truncate text-[11px]" style={{ color: "#888" }}>{r.description}</div>
                </div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-divider bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              <div className="text-lg font-black">{selected ? "Request this service" : "Custom brief"}</div>
            </div>
            {sent ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <div className="text-lg font-black">Request sent</div>
                <div className="mt-1 text-xs" style={{ color: "#666" }}>Our team will get back to you with a proposal.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Redesign landing page" /></div>
                <div><Label>Describe what you need</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Goals, references, timing…" /></div>
                <div><Label>Budget (optional)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="USD" /></div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setCustomOpen(false)}>Cancel</Button>
                  <Button onClick={submit} disabled={!form.title.trim()}><Send className="h-4 w-4" /> Send request</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
