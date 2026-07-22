import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, formatDate } from "@/lib/crm/hooks";
import { PageHeader, TagPill } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Upload, Search, Filter, Users, Building2, Mail, CalendarPlus } from "lucide-react";
import { ExportMenu } from "@/components/crm/ExportMenu";

const EMPTY_ARR: any[] = [];
const APP_MODULES = [
  "Projects", "Tasks", "Invoices", "Estimates", "Payments",
  "Tickets", "Files", "Contracts", "Proposals", "Subscriptions",
];

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Clients · MetaEdge Creatives CRM" },
      { name: "description", content: "Manage clients and companies." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const can = useCan("contacts");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [showFilter, setShowFilter] = useState(false);
  const contacts = useCRM((s) => s.contacts);
  const companies = useCRM((s) => s.companies);
  const addCompany = useCRM((s) => s.addCompany);
  const updateCompany = useCRM((s) => s.updateCompany);
  const deleteCompany = useCRM((s) => s.deleteCompany);
  const categories = useCRM((s) => s.lists["client.categories"]) ?? EMPTY_ARR;
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const filteredContacts = useMemo(
    () =>
      contacts.filter((c) =>
        [c.name, c.email, c.title, c.phone].some((f) =>
          (f ?? "").toLowerCase().includes(q.toLowerCase()),
        ),
      ),
    [contacts, q],
  );
  const filteredCompanies = useMemo(
    () => companies.filter((c) => {
      const hay = `${c.name} ${c.email ?? ""} ${c.firstName ?? ""} ${c.lastName ?? ""} ${c.industry ?? ""}`.toLowerCase();
      const matchesQ = hay.includes(q.toLowerCase());
      const matchesCat = category === "all" || (c.category ?? "Default") === category;
      return matchesQ && matchesCat;
    }),
    [companies, q, category],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      total: companies.length,
      contacts: contacts.length,
      withEmail: companies.filter((c) => c.email).length,
      newThisMonth: companies.filter((c) => c.createdAt >= monthStart).length,
    };
  }, [companies, contacts]);

  const exportClients = () => {
    const blob = new Blob([JSON.stringify(companies, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `clients-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importClients = async (file: File) => {
    try {
      const text = await file.text();
      let rows: any[] = [];
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // simple CSV: name,email,category,...
        const lines = text.split(/\r?\n/).filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const obj: any = {};
          headers.forEach((h, i) => (obj[h] = cols[i]?.trim()));
          return obj;
        });
      }
      let count = 0;
      for (const r of rows) {
        if (!r.name && !r.company && !r.companyName) continue;
        addCompany({
          name: (r.name || r.company || r.companyName || "").trim(),
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          category: r.category || "Default",
          industry: r.industry,
          website: r.website,
          notes: r.notes,
        } as any);
        count++;
      }
      alert(`Imported ${count} client${count === 1 ? "" : "s"}.`);
    } catch (e) {
      alert("Import failed: " + (e instanceof Error ? e.message : "invalid file"));
    }
  };

  if (!can) return <NoAccess module="Contacts" />;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Companies and the people behind them."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="font-bold">
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportClients} className="font-bold">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importClients(f); e.target.value = ""; }}
            />
            <NewContactDialog />
            <NewCompanyDialog />
          </div>
        }
      />

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<Building2 className="h-4 w-4" />} label="Total Clients" value={stats.total} />
        <StatTile icon={<Users className="h-4 w-4" />} label="Contacts" value={stats.contacts} />
        <StatTile icon={<Mail className="h-4 w-4" />} label="With Email" value={stats.withEmail} />
        <StatTile icon={<CalendarPlus className="h-4 w-4" />} label="New This Month" value={stats.newThisMonth} />
      </div>

      {/* Search + Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#999" }} />
          <Input
            placeholder="Search name, email, company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilter((v) => !v)} className="font-bold">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
      </div>

      {showFilter && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-divider bg-card p-4">
          <div className="min-w-[200px]">
            <Label className="mb-1 block">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="Default">Default</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {category !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setCategory("all")}>Clear</Button>
          )}
        </div>
      )}

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">
            Clients <span className="ml-2 text-[10px] font-bold" style={{ color: "#999" }}>{filteredCompanies.length}</span>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts <span className="ml-2 text-[10px] font-bold" style={{ color: "#999" }}>{filteredContacts.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="mt-4">
          {filteredCompanies.length === 0 ? (
            <EmptyState
              title="No clients yet"
              description="Add your first client to start tracking work."
              action={<NewCompanyDialog />}
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-divider bg-card p-3">
                <label className="flex items-center gap-2 text-xs font-bold">
                  <Checkbox
                    checked={
                      filteredCompanies.length > 0 &&
                      filteredCompanies.every((c) => selected.has(c.id))
                    }
                    onCheckedChange={(v) => {
                      if (v) setSelected(new Set(filteredCompanies.map((c) => c.id)));
                      else setSelected(new Set());
                    }}
                  />
                  Select all
                </label>
                <span className="text-xs" style={{ color: "#666" }}>
                  {selected.size} selected
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={() => {
                      const rows = companies.filter((c) => selected.has(c.id));
                      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `clients-selected-${new Date().toISOString().slice(0, 10)}.json`;
                      document.body.appendChild(a); a.click(); a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="font-bold"
                  >
                    <Download className="h-3.5 w-3.5" /> Export selected
                  </Button>
                  <Select value={bulkCategory} onValueChange={(v) => {
                    setBulkCategory(v);
                    selected.forEach((id) => updateCompany(id, { category: v }));
                    setBulkCategory("");
                  }}>
                    <SelectTrigger className="h-8 w-[160px] text-xs" disabled={selected.size === 0}>
                      <SelectValue placeholder="Change category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected.size === 0}
                    onClick={() => {
                      if (!confirm(`Delete ${selected.size} client${selected.size === 1 ? "" : "s"}?`)) return;
                      selected.forEach((id) => deleteCompany(id));
                      setSelected(new Set());
                    }}
                    className="font-bold text-primary"
                  >
                    Delete selected
                  </Button>
                  {selected.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map((co) => {
                  const cCount = contacts.filter((c) => c.companyId === co.id).length;
                  const isSel = selected.has(co.id);
                  return (
                    <div key={co.id} className="relative">
                      <div
                        className="absolute left-3 top-3 z-10 rounded bg-card p-1 shadow"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(co.id); }}
                      >
                        <Checkbox checked={isSel} onCheckedChange={() => toggleSelect(co.id)} />
                      </div>
                      <Link
                        to="/companies/$id"
                        params={{ id: co.id }}
                        className={`block rounded-xl border bg-card brand-shadow p-5 transition-transform hover:-translate-y-0.5 ${isSel ? "border-primary" : "border-divider"}`}
                      >
                        <div className="h-1 -mt-5 -mx-5 mb-4 rounded-t-xl bg-primary" />
                        <div className="pl-8 text-base font-extrabold">{co.name}</div>
                        {(co.firstName || co.lastName) && (
                          <div className="pl-8 text-xs mt-0.5" style={{ color: "#666" }}>
                            {[co.firstName, co.lastName].filter(Boolean).join(" ")}
                          </div>
                        )}
                        {co.email && (
                          <div className="text-xs mt-0.5" style={{ color: "#999" }}>{co.email}</div>
                        )}
                        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#666" }}>
                          <span>{cCount} contact{cCount === 1 ? "" : "s"}</span>
                          <TagPill>{co.category || "Default"}</TagPill>
                        </div>
                        {co.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {co.tags.slice(0, 3).map((t) => (
                              <TagPill key={t}>{t}</TagPill>
                            ))}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="contacts" className="mt-4">
          {filteredContacts.length === 0 ? (
            <EmptyState
              title="No contacts yet"
              description="Add your first contact to start tracking conversations."
              action={<NewContactDialog />}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-divider bg-card brand-shadow">
              <table className="w-full text-sm">
                <thead className="border-b border-divider bg-muted/40 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#666" }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Name</th>
                    <th className="px-4 py-3 text-left font-bold">Company</th>
                    <th className="px-4 py-3 text-left font-bold">Email</th>
                    <th className="px-4 py-3 text-left font-bold">Phone</th>
                    <th className="px-4 py-3 text-left font-bold">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => {
                    const co = companies.find((x) => x.id === c.companyId);
                    return (
                      <tr key={c.id} className="border-b border-divider last:border-0 hover:bg-accent/40">
                        <td className="px-4 py-3">
                          <Link to="/contacts/$id" params={{ id: c.id }} className="font-extrabold text-foreground hover:text-primary">
                            {c.name}
                          </Link>
                          {c.title && (
                            <div className="text-[11px]" style={{ color: "#999" }}>{c.title}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {co ? (
                            <Link to="/companies/$id" params={{ id: co.id }} className="text-primary font-semibold">
                              {co.name}
                            </Link>
                          ) : (
                            <span style={{ color: "#999" }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#666" }}>{c.email || "—"}</td>
                        <td className="px-4 py-3" style={{ color: "#666" }}>{c.phone || "—"}</td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: "#999" }}>{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-divider bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
        {icon} {label}
      </div>
      <div className="mt-1.5 text-2xl font-black">{value}</div>
    </div>
  );
}

function NewContactDialog() {
  const [open, setOpen] = useState(false);
  const companies = useCRM((s) => s.companies);
  const addContact = useCRM((s) => s.addContact);
  const [form, setForm] = useState({ name: "", email: "", phone: "", title: "", companyId: "", notes: "" });

  const submit = () => {
    if (!form.name.trim()) return;
    addContact({
      name: form.name.trim(),
      email: form.email || undefined,
      phone: form.phone || undefined,
      title: form.title || undefined,
      companyId: form.companyId || undefined,
      notes: form.notes || undefined,
    });
    setForm({ name: "", email: "", phone: "", title: "", companyId: "", notes: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-bold">+ Contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Company</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="font-bold">Save contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCompanyDialog() {
  const [open, setOpen] = useState(false);
  const addCompany = useCRM((s) => s.addCompany);
  const categories = useCRM((s) => s.lists["client.categories"]) ?? EMPTY_ARR;
  const emptyForm = {
    name: "", firstName: "", lastName: "", email: "",
    category: "Default", description: "",
    billingAddress: "", invoiceDueDays: 14, shippingAddress: "",
    appModules: [] as string[], moreInformation: "",
    website: "", industry: "",
  };
  const [form, setForm] = useState(emptyForm);

  const toggleModule = (m: string) => {
    setForm((f) => ({
      ...f,
      appModules: f.appModules.includes(m) ? f.appModules.filter((x) => x !== m) : [...f.appModules, m],
    }));
  };

  const submit = () => {
    if (!form.name.trim()) return;
    addCompany({
      name: form.name.trim(),
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      category: form.category || "Default",
      description: form.description || undefined,
      billingAddress: form.billingAddress || undefined,
      shippingAddress: form.shippingAddress || undefined,
      invoiceDueDays: form.invoiceDueDays || undefined,
      appModules: form.appModules.length ? form.appModules : undefined,
      moreInformation: form.moreInformation || undefined,
      website: form.website || undefined,
      industry: form.industry || undefined,
    } as any);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <NewButton>Add Client</NewButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Identity */}
          <section className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-primary">Client details</div>
            <div>
              <Label>Company Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Default">Default</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-primary">Description & Details</div>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this client do?" />
          </section>

          {/* Billing */}
          <section className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-primary">Billing</div>
            <div>
              <Label>Billing Address</Label>
              <Textarea rows={2} value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Invoice Due Days</Label>
                <Input type="number" value={form.invoiceDueDays}
                  onChange={(e) => setForm({ ...form, invoiceDueDays: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Shipping Address</Label>
              <Textarea rows={2} value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} />
            </div>
          </section>

          {/* App Modules */}
          <section className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-primary">App Modules</div>
            <p className="text-[11px]" style={{ color: "#999" }}>Enable which modules this client can access in the portal.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {APP_MODULES.map((m) => (
                <label key={m} className="flex items-center gap-2 rounded-lg border border-divider bg-background px-3 py-2 text-[13px] font-semibold">
                  <Checkbox checked={form.appModules.includes(m)} onCheckedChange={() => toggleModule(m)} />
                  {m}
                </label>
              ))}
            </div>
          </section>

          {/* More Information */}
          <section className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-primary">More Information</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>
            <Textarea rows={3} value={form.moreInformation} onChange={(e) => setForm({ ...form, moreInformation: e.target.value })} placeholder="Any additional information…" />
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="font-bold">Save Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { NewContactDialog, NewCompanyDialog };
