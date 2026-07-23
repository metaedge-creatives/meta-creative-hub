import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layers, Send, CheckCircle2, Search, MessageSquarePlus, ClipboardList, ArrowRight, Loader2, AlertCircle } from "lucide-react";

const TITLE_MAX = 120;
const DESC_MAX = 2000;
const BUDGET_MAX = 10_000_000;

const requestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(TITLE_MAX, `Title must be under ${TITLE_MAX} characters`),
  description: z
    .string()
    .trim()
    .max(DESC_MAX, `Description must be under ${DESC_MAX} characters`)
    .optional()
    .or(z.literal("")),
  budget: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0 && Number(v) <= BUDGET_MAX), {
      message: "Enter a positive amount up to 10,000,000",
    }),
});

type FieldErrors = Partial<Record<"title" | "description" | "budget" | "form", string>>;

export const Route = createFileRoute("/portal/services")({
  head: () => ({ meta: [{ title: "Services · Client Portal" }] }),
  component: PortalServices,
});

const DEFAULT_SERVICES: Array<{ name: string; description: string; category: string }> = [
  { name: "Web Development", description: "Modern, responsive websites and web apps built for performance.", category: "Web" },
  { name: "UI/UX Designing", description: "Intuitive interfaces and user experiences that convert.", category: "Design" },
  { name: "Branding", description: "Logo, palette, typography and full brand guidelines.", category: "Branding" },
  { name: "AI Automations", description: "Automate workflows and repetitive tasks with AI.", category: "AI" },
  { name: "Custom Business Solution", description: "Tailored software solutions built around your business.", category: "Custom" },
  { name: "CRM Automation", description: "Streamline your sales and client workflows end-to-end.", category: "CRM" },
  { name: "LLC Formation", description: "Register and launch your LLC — done for you.", category: "Business" },
  { name: "Video Editing", description: "Reels, ads and long-form video editing.", category: "Video" },
  { name: "Graphic Designing", description: "Marketing creatives, print and digital graphics.", category: "Design" },
  { name: "Social Media Management", description: "Content strategy, design and posting across platforms.", category: "Social" },
];

function PortalServices() {

  const client = useCurrentClientUser();
  const products = useCRM((s) => s.getList("products"));
  const addServiceRequest = useCRM((s) => s.addServiceRequest);
  const myRequests = useCRM((s) => s.serviceRequests);

  const [q, setQ] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", budget: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!customOpen) {
      setErrors({});
      setSubmitting(false);
    }
  }, [customOpen]);

  const catalog = useMemo(() => {
    if (products.length > 0) return products;
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
    setErrors({});
    setCustomOpen(true);
  };

  const updateField = (key: "title" | "description" | "budget", value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key] || errors.form) setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const submit = async () => {
    if (submitting) return;
    if (!client) {
      setErrors({ form: "You must be signed in to submit a request." });
      toast.error("Please sign in to send a request.");
      return;
    }
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      // Simulated network step keeps UX honest and future-proof for a real API.
      await new Promise((r) => setTimeout(r, 400));
      const req = addServiceRequest({
        clientUserId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        productId: selected ?? undefined,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || "",
        budget: parsed.data.budget ? Number(parsed.data.budget) : undefined,
      });
      setSent(req.id);
      setForm({ title: "", description: "", budget: "" });
      setSelected(null);
      toast.success("Request sent — we'll be in touch shortly.");
      setTimeout(() => { setCustomOpen(false); setSent(null); }, 1400);
    } catch (err) {
      console.error("[services] submit failed", err);
      setErrors({ form: "Something went wrong sending your request. Please try again." });
      toast.error("Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        <Button onClick={() => { setSelected(null); setForm({ title: "", description: "", budget: "" }); setErrors({}); setCustomOpen(true); }} className="font-bold">
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
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary">Your recent requests</div>
            <Link to="/portal/requests" className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary hover:underline">
              <ClipboardList className="h-3 w-3" /> Track all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {mine.slice(0, 3).map((r) => (
              <Link
                key={r.id}
                to="/portal/requests"
                className="flex items-center justify-between rounded-xl border border-divider bg-white p-3 text-sm transition hover:border-primary/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-black">{r.title}</div>
                  <div className="truncate text-[11px]" style={{ color: "#888" }}>{r.description}</div>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">{r.status}</span>
              </Link>
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
              <form
                className="space-y-3"
                onSubmit={(e) => { e.preventDefault(); void submit(); }}
                noValidate
              >
                <div>
                  <Label htmlFor="req-title">Title *</Label>
                  <Input
                    id="req-title"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g. Redesign landing page"
                    maxLength={TITLE_MAX}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? "req-title-err" : undefined}
                    disabled={submitting}
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    {errors.title ? (
                      <span id="req-title-err" className="text-primary">{errors.title}</span>
                    ) : <span className="text-muted-foreground">Min 3 characters.</span>}
                    <span className="text-muted-foreground">{form.title.length}/{TITLE_MAX}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="req-desc">Describe what you need</Label>
                  <Textarea
                    id="req-desc"
                    rows={4}
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Goals, references, timing…"
                    maxLength={DESC_MAX}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? "req-desc-err" : undefined}
                    disabled={submitting}
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    {errors.description ? (
                      <span id="req-desc-err" className="text-primary">{errors.description}</span>
                    ) : <span className="text-muted-foreground">Optional but helpful.</span>}
                    <span className="text-muted-foreground">{form.description.length}/{DESC_MAX}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="req-budget">Budget (optional)</Label>
                  <Input
                    id="req-budget"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    placeholder="USD"
                    aria-invalid={!!errors.budget}
                    aria-describedby={errors.budget ? "req-budget-err" : undefined}
                    disabled={submitting}
                  />
                  {errors.budget && (
                    <div id="req-budget-err" className="mt-1 text-[11px] text-primary">{errors.budget}</div>
                  )}
                </div>
                {errors.form && (
                  <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-[12px] text-primary">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setCustomOpen(false)} disabled={submitting}>Cancel</Button>
                  <Button type="submit" disabled={submitting || !form.title.trim()}>
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send request</>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
