import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan } from "@/lib/crm/hooks";
import { PROJECT_STATUSES, type ProjectStatus, type ProjectBilling, type ProjectPermissions } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "New Project · MetaEdge Creatives CRM" }] }),
  component: NewProjectPage,
});

const TEAM_FALLBACK = [
  "Imran Ali", "Saair Mehmood", "Junaid Ur Rehman", "Hashim Safdar",
  "Zia Bukhari", "Taras Sergeev", "Sawaira", "Maryam", "Asim Afzal", "Kinza", "Muskan",
];

const CATEGORIES = ["Default", "Branding", "Web Design", "Marketing", "Content", "Development"];
const TEMPLATES = ["None", "Brand Identity", "Website Build", "Social Campaign", "Retainer"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-divider bg-card brand-shadow overflow-hidden">
      <div className="border-b border-divider bg-muted/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#666" }}>{title}</div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function MultiCheck({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.id);
        return (
          <button type="button" key={o.id} onClick={() => toggle(o.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card hover:bg-accent/40"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function NewProjectPage() {
  const can = useCan("projects");
  const navigate = useNavigate();
  const companies = useCRM((s) => s.companies);
  const contacts = useCRM((s) => s.contacts);
  const users = useCRM((s) => s.users);
  const addProject = useCRM((s) => s.addProject);
  const addCompany = useCRM((s) => s.addCompany);
  const addContact = useCRM((s) => s.addContact);

  const teamOptions = useMemo(() => {
    if (users.length > 0) return users.map((u) => ({ id: u.id, label: u.name }));
    return TEAM_FALLBACK.map((n) => ({ id: n, label: n }));
  }, [users]);

  const [clientKind, setClientKind] = useState<"new" | "existing">("existing");
  const [existingCompanyId, setExistingCompanyId] = useState("");
  const [existingContactId, setExistingContactId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [template, setTemplate] = useState("None");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("Default");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [managers, setManagers] = useState<string[]>([]);
  const [status, setStatus] = useState<ProjectStatus>("brief");
  const [progressManual, setProgressManual] = useState(false);
  const [progress, setProgress] = useState(0);
  const [billing, setBilling] = useState<ProjectBilling>("fixed");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [estimatedCosts, setEstimatedCosts] = useState<string>("");
  const [perms, setPerms] = useState<ProjectPermissions>({
    taskCollab: true,
    clientViewTasks: true,
    clientTaskParticipation: false,
    clientCreateTasks: false,
    clientChecklist: false,
    clientViewTimesheets: false,
    clientViewExpenses: false,
  });
  const [moreInfo, setMoreInfo] = useState("");

  if (!can) return <NoAccess module="Projects" />;

  const setPerm = (key: keyof ProjectPermissions, val: boolean) => {
    setPerms((p) => {
      const next = { ...p, [key]: val };
      // Auto-link: participation/create requires view
      if ((key === "clientTaskParticipation" || key === "clientCreateTasks") && val) {
        next.clientViewTasks = true;
      }
      if (key === "clientViewTasks" && !val) {
        next.clientTaskParticipation = false;
        next.clientCreateTasks = false;
      }
      return next;
    });
  };

  const submit = () => {
    if (!name.trim()) { alert("Project title is required"); return; }
    let companyId: string | undefined;
    let contactId: string | undefined;
    if (clientKind === "existing") {
      companyId = existingCompanyId || undefined;
      contactId = existingContactId || undefined;
      if (!companyId && !contactId) { alert("Select an existing client"); return; }
    } else {
      if (!newClientName.trim()) { alert("New client name is required"); return; }
      const c = addContact({ name: newClientName.trim(), email: newClientEmail || undefined });
      contactId = c.id;
    }

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const created = addProject({
      name: name.trim(),
      brief: description || undefined,
      status,
      companyId,
      contactId,
      deadline: deadline || undefined,
      startDate: startDate || undefined,
      clientKind,
      template: template !== "None" ? template : undefined,
      tags: tagList,
      category,
      assignedUserIds: assigned,
      managerIds: managers,
      progressManual,
      progress: progressManual ? Number(progress) || 0 : 0,
      billing,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      estimatedCosts: estimatedCosts ? Number(estimatedCosts) : undefined,
      permissions: perms,
      moreInfo: moreInfo || undefined,
    });

    // silence unused-var warning for addCompany when not used
    void addCompany;

    navigate({ to: "/projects/$id", params: { id: created.id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create A New Project"
        subtitle="Set up scope, team, billing and client permissions."
        actions={
          <Link to="/projects">
            <Button variant="outline" className="font-bold"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Client & Basics">
            <div>
              <Label className="mb-2 block">Client *</Label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setClientKind("new")}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${clientKind === "new" ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card"}`}>New Client</button>
                <button type="button" onClick={() => setClientKind("existing")}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${clientKind === "existing" ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card"}`}>Existing Client</button>
              </div>
              {clientKind === "existing" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Company</Label>
                    <Select value={existingCompanyId} onValueChange={setExistingCompanyId}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Select value={existingContactId} onValueChange={setExistingContactId}>
                      <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                      <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} /></div>
                  <div><Label>Email</Label><Input value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} /></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Project Title *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brand refresh for Acme" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
            </div>

            <div>
              <Label>Description & Details</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label>Tags</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated (e.g. branding, urgent)" />
            </div>
          </Section>

          <Section title="Category & Users">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Assigned</Label>
              <MultiCheck options={teamOptions} value={assigned} onChange={setAssigned} />
            </div>
            <div>
              <Label className="mb-2 block">Manager</Label>
              <MultiCheck options={teamOptions} value={managers} onChange={setManagers} />
            </div>
          </Section>

          <Section title="Progress">
            <div className="flex items-center gap-3">
              <Checkbox id="pm" checked={progressManual} onCheckedChange={(v) => setProgressManual(Boolean(v))} />
              <Label htmlFor="pm" className="cursor-pointer">Set Progress Manually?</Label>
            </div>
            {progressManual && (
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={100} step={0.01} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-32" />
                <span className="text-sm font-semibold">%</span>
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Project Billing">
            <div>
              <Label>Billing</Label>
              <Select value={billing} onValueChange={(v) => setBilling(v as ProjectBilling)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Estimated Hours</Label><Input type="number" min={0} value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} /></div>
            <div><Label>Estimated Costs</Label><Input type="number" min={0} step="0.01" value={estimatedCosts} onChange={(e) => setEstimatedCosts(e.target.value)} /></div>
          </Section>

          <Section title="Assigned User's Permissions">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox checked={!!perms.taskCollab} onCheckedChange={(v) => setPerm("taskCollab", Boolean(v))} />
              <span>Task Collaboration</span>
            </label>
          </Section>

          <Section title="Client's Project Permissions">
            {[
              { k: "clientViewTasks", label: "View Tasks" },
              { k: "clientTaskParticipation", label: "Tasks Participation **" },
              { k: "clientCreateTasks", label: "Create Tasks **" },
              { k: "clientChecklist", label: "Project Checklist" },
              { k: "clientViewTimesheets", label: "View Time Sheets" },
              { k: "clientViewExpenses", label: "View Expenses" },
            ].map(({ k, label }) => (
              <label key={k} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={!!perms[k as keyof ProjectPermissions]}
                  onCheckedChange={(v) => setPerm(k as keyof ProjectPermissions, Boolean(v))}
                />
                <span>{label}</span>
              </label>
            ))}
            <p className="text-[11px]" style={{ color: "#888" }}>** If selected, viewing permission is enabled automatically & vice-versa.</p>
          </Section>

          <Section title="More Information">
            <Textarea rows={4} value={moreInfo} onChange={(e) => setMoreInfo(e.target.value)} placeholder="Anything else worth capturing…" />
          </Section>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <Link to="/projects"><Button variant="outline" className="font-bold">Cancel</Button></Link>
        <Button onClick={submit} className="font-bold">Create Project</Button>
      </div>
    </div>
  );
}
