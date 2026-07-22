import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CRMState,
  Company,
  Contact,
  Deal,
  DealStage,
  Note,
  Project,
  ProjectStatus,
  Task,
  User,
  Permissions,
  ParentType,
} from "./types";
import type {
  Invoice,
  InvoiceStatus,
  Lead,
  LeadStatus,
  Proposal,
  ProposalStatus,
  Contract,
  ContractStatus,
  SupportTicket,
  TicketStatus,
  EmailCampaign,
  CampaignStatus,
  ClientUser,
  EmailConfig,
  ServiceRequest,
  ServiceRequestStatus,
  ClientReport,
  ConsultationBooking,
  ConsultationStatus,
} from "./types";
import type { ListItem, ErrorLog } from "./types";
import type { AppNotification, NotificationKind } from "./types";
import {
  pushClientUser,
  deleteClientUserRemote,
  fetchAllClientUsers,
  mergeClientUsers,
} from "./cloudSync";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function resolveClientUserId(
  clientUsers: ClientUser[],
  ref: { email?: string; name?: string; company?: string },
): string | undefined {
  const email = ref.email?.trim().toLowerCase();
  const name = ref.name?.trim().toLowerCase();
  const company = ref.company?.trim().toLowerCase();
  if (email) {
    const hit = clientUsers.find((c) => c.email.trim().toLowerCase() === email);
    if (hit) return hit.id;
  }
  if (name) {
    const hit = clientUsers.find((c) => {
      const cn = c.name.trim().toLowerCase();
      const cc = (c.companyName || "").trim().toLowerCase();
      return cn === name || (cc && cc === name);
    });
    if (hit) return hit.id;
  }
  if (company) {
    const hit = clientUsers.find((c) => (c.companyName || "").trim().toLowerCase() === company);
    if (hit) return hit.id;
  }
  return undefined;
}

const allPerms: Permissions = {
  contacts: true,
  deals: true,
  projects: true,
  tasks: true,
  invoices: true,
  leads: true,
  proposals: true,
  contracts: true,
  support: true,
  emailMarketing: true,
  clientUsers: true,
  settings: true,
};

const seedAdminId = "seed-admin";

const seed: CRMState = {
  users: [
    {
      id: seedAdminId,
      name: "Super Admin",
      email: "info@metaedgecreatives.com",
      jobTitle: "Founder",
      isSuperAdmin: true,
      permissions: { ...allPerms },
      password: "Ineedthelogins123",
    },
  ],
  companies: [],
  contacts: [],
  deals: [],
  projects: [],
  tasks: [],
  notes: [],
  invoices: [],
  leads: [],
  proposals: [],
  contracts: [],
  tickets: [],
  campaigns: [],
  clientUsers: [],
  emailConfig: {
    provider: "none",
    fromName: "MetaEdge Creatives",
    fromEmail: "info@metaedgecreatives.com",
  },
  resetCodes: [],
  currentUserId: null,
  currentClientUserId: null,
  clientResetCodes: [],
  pendingSignups: [],
  moduleSettings: {},
  lists: {},
  errorLogs: [],
  notifications: [],
  serviceRequests: [],
  clientReports: [],
  exportHistory: [],
  consultationBookings: [],
};

interface Actions {
  setCurrentUser: (id: string | null) => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  replaceAll: (state: CRMState) => void;
  reset: () => void;

  addUser: (user: Omit<User, "id">) => User;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setUserPermission: (id: string, key: keyof Permissions, value: boolean) => void;

  addCompany: (c: Omit<Company, "id" | "createdAt" | "tags"> & { tags?: string[] }) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addContact: (c: Omit<Contact, "id" | "createdAt" | "tags"> & { tags?: string[] }) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  addDeal: (d: Omit<Deal, "id" | "createdAt">) => Deal;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  moveDealStage: (id: string, stage: DealStage) => void;
  deleteDeal: (id: string) => void;

  addProject: (p: Omit<Project, "id" | "createdAt" | "deliverables"> & { deliverables?: Project["deliverables"] }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  addDeliverable: (projectId: string, title: string) => void;
  toggleDeliverable: (projectId: string, deliverableId: string) => void;
  removeDeliverable: (projectId: string, deliverableId: string) => void;
  deleteProject: (id: string) => void;

  addTask: (t: Omit<Task, "id" | "createdAt" | "done">) => Task;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addNote: (n: { body: string; parentType: ParentType; parentId: string; authorId: string }) => Note;
  deleteNote: (id: string) => void;

  addInvoice: (i: Omit<Invoice, "id" | "createdAt">) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;

  addLead: (l: Omit<Lead, "id" | "createdAt">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  setLeadStatus: (id: string, status: LeadStatus) => void;
  deleteLead: (id: string) => void;

  addProposal: (p: Omit<Proposal, "id" | "createdAt">) => Proposal;
  updateProposal: (id: string, patch: Partial<Proposal>) => void;
  setProposalStatus: (id: string, status: ProposalStatus) => void;
  deleteProposal: (id: string) => void;

  addContract: (c: Omit<Contract, "id" | "createdAt">) => Contract;
  updateContract: (id: string, patch: Partial<Contract>) => void;
  setContractStatus: (id: string, status: ContractStatus) => void;
  deleteContract: (id: string) => void;

  addTicket: (t: Omit<SupportTicket, "id" | "createdAt">) => SupportTicket;
  updateTicket: (id: string, patch: Partial<SupportTicket>) => void;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  deleteTicket: (id: string) => void;

  addCampaign: (c: Omit<EmailCampaign, "id" | "createdAt">) => EmailCampaign;
  updateCampaign: (id: string, patch: Partial<EmailCampaign>) => void;
  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  deleteCampaign: (id: string) => void;

  addClientUser: (c: Omit<ClientUser, "id" | "createdAt">) => ClientUser;
  updateClientUser: (id: string, patch: Partial<ClientUser>) => void;
  deleteClientUser: (id: string) => void;
  resendClientInvite: (id: string) => { ok: boolean; error?: string; user?: ClientUser };

  clientSignup: (input: { name: string; email: string; password: string; companyName?: string; phone?: string }) => { ok: boolean; error?: string; user?: ClientUser };
  requestClientSignup: (input: { name: string; email: string; password: string; companyName?: string; phone?: string }) => { ok: boolean; error?: string; code?: string };
  verifyClientSignup: (email: string, code: string) => { ok: boolean; error?: string; user?: ClientUser };
  clientLogin: (email: string, password: string) => { ok: boolean; error?: string };
  hydrateClientUsersFromCloud: () => Promise<void>;
  clientLogout: () => void;
  setCurrentClientUser: (id: string | null) => void;
  updateCurrentClientUser: (patch: Partial<ClientUser>) => void;
  requestClientPasswordReset: (email: string) => { ok: boolean; code?: string; error?: string };
  resetClientPassword: (email: string, code: string, newPassword: string) => { ok: boolean; error?: string };

  setEmailConfig: (patch: Partial<EmailConfig>) => void;

  requestPasswordReset: (email: string) => { ok: boolean; code?: string; error?: string };
  verifyResetCode: (email: string, code: string) => { ok: boolean; error?: string };
  resetPassword: (email: string, code: string, newPassword: string) => { ok: boolean; error?: string };

  setSetting: (section: string, key: string, value: any) => void;
  setSettings: (section: string, patch: Record<string, any>) => void;
  getSetting: (section: string, key: string, fallback?: any) => any;

  getList: (listKey: string) => ListItem[];
  addListItem: (listKey: string, item: Omit<ListItem, "id">) => ListItem;
  updateListItem: (listKey: string, id: string, patch: Partial<ListItem>) => void;
  deleteListItem: (listKey: string, id: string) => void;
  reorderList: (listKey: string, ids: string[]) => void;

  pushErrorLog: (message: string, level?: ErrorLog["level"]) => void;
  clearErrorLogs: () => void;
  logExport: (entry: { entity: string; format: "csv" | "pdf" | "json"; filename: string; rowCount: number }) => void;
  clearExportHistory: () => void;
  clearCache: () => void;

  addNotification: (n: { kind: NotificationKind; title: string; body?: string; link?: string }) => AppNotification;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;

  addServiceRequest: (r: Omit<ServiceRequest, "id" | "createdAt" | "status"> & { status?: ServiceRequestStatus }) => ServiceRequest;
  updateServiceRequest: (id: string, patch: Partial<ServiceRequest>) => void;
  setServiceRequestStatus: (id: string, status: ServiceRequestStatus) => void;
  deleteServiceRequest: (id: string) => void;

  addClientReport: (r: Omit<ClientReport, "id" | "createdAt">) => ClientReport;
  updateClientReport: (id: string, patch: Partial<ClientReport>) => void;
  deleteClientReport: (id: string) => void;

  addConsultationBooking: (
    b: Omit<ConsultationBooking, "id" | "createdAt" | "status"> & { status?: ConsultationStatus },
  ) => ConsultationBooking;
  updateConsultationBooking: (id: string, patch: Partial<ConsultationBooking>) => void;
  setConsultationStatus: (id: string, status: ConsultationStatus) => void;
  deleteConsultationBooking: (id: string) => void;
}

export const useCRM = create<CRMState & Actions>()(
  persist(
    (set, get) => ({
      ...seed,

      addNotification: (n) => {
        const item: AppNotification = {
          ...n,
          id: uid(),
          read: false,
          at: new Date().toISOString(),
        };
        set((s) => ({ notifications: [item, ...s.notifications].slice(0, 200) }));
        return item;
      },
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      deleteNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      clearNotifications: () => set({ notifications: [] }),

      setCurrentUser: (id) => set({ currentUserId: id }),
      login: (email, password) => {
        const emailNorm = email.trim().toLowerCase();
        const user = get().users.find(
          (u) => u.email.trim().toLowerCase() === emailNorm && u.password === password,
        );
        if (!user) return { ok: false, error: "Invalid email or password." };
        set({ currentUserId: user.id });
        return { ok: true };
      },
      logout: () => set({ currentUserId: null }),
      replaceAll: (state) => set(state),
      reset: () => set(seed),

      addUser: (user) => {
        const u: User = { ...user, id: uid() };
        set((s) => ({ users: [...s.users, u] }));
        return u;
      },
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) => {
        const state = get();
        const target = state.users.find((u) => u.id === id);
        if (target?.isSuperAdmin) {
          const others = state.users.filter((u) => u.isSuperAdmin && u.id !== id);
          if (others.length === 0) return;
        }
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
          currentUserId:
            s.currentUserId === id
              ? null
              : s.currentUserId,
        }));
      },
      setUserPermission: (id, key, value) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, permissions: { ...u.permissions, [key]: value } } : u,
          ),
        })),

      addCompany: (c) => {
        const item: Company = {
          ...c,
          tags: c.tags ?? [],
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ companies: [item, ...s.companies] }));
        get().addNotification({ kind: "company", title: "New company added", body: item.name, link: "/contacts" });
        return item;
      },
      updateCompany: (id, patch) =>
        set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCompany: (id) =>
        set((s) => ({
          companies: s.companies.filter((c) => c.id !== id),
          contacts: s.contacts.map((ct) => (ct.companyId === id ? { ...ct, companyId: undefined } : ct)),
          deals: s.deals.map((d) => (d.companyId === id ? { ...d, companyId: undefined } : d)),
          projects: s.projects.map((p) => (p.companyId === id ? { ...p, companyId: undefined } : p)),
        })),

      addContact: (c) => {
        const item: Contact = {
          ...c,
          tags: c.tags ?? [],
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ contacts: [item, ...s.contacts] }));
        get().addNotification({ kind: "contact", title: "New client added", body: item.name, link: `/contacts/${item.id}` });
        return item;
      },
      updateContact: (id, patch) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteContact: (id) =>
        set((s) => ({
          contacts: s.contacts.filter((c) => c.id !== id),
          deals: s.deals.map((d) => (d.contactId === id ? { ...d, contactId: undefined } : d)),
          projects: s.projects.map((p) => (p.contactId === id ? { ...p, contactId: undefined } : p)),
        })),

      addDeal: (d) => {
        const item: Deal = { ...d, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ deals: [item, ...s.deals] }));
        get().addNotification({ kind: "deal", title: "New deal created", body: item.title, link: `/deals/${item.id}` });
        return item;
      },
      updateDeal: (id, patch) =>
        set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      moveDealStage: (id, stage) => {
        const prev = get().deals.find((d) => d.id === id);
        set((s) => ({ deals: s.deals.map((d) => (d.id === id ? { ...d, stage } : d)) }));
        if (prev && stage === "won" && prev.stage !== "won") {
          get().addNotification({ kind: "deal_won", title: "Deal won 🎉", body: prev.title, link: `/deals/${id}` });
        }
      },
      deleteDeal: (id) =>
        set((s) => ({
          deals: s.deals.filter((d) => d.id !== id),
          projects: s.projects.map((p) => (p.dealId === id ? { ...p, dealId: undefined } : p)),
        })),

      addProject: (p) => {
        const item: Project = {
          ...p,
          deliverables: p.deliverables ?? [],
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ projects: [item, ...s.projects] }));
        get().addNotification({ kind: "project", title: "New project", body: item.name, link: `/projects/${item.id}` });
        return item;
      },
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProjectStatus: (id, status) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)) })),
      addDeliverable: (projectId, title) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, deliverables: [...p.deliverables, { id: uid(), title, done: false }] }
              : p,
          ),
        })),
      toggleDeliverable: (projectId, deliverableId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  deliverables: p.deliverables.map((d) =>
                    d.id === deliverableId ? { ...d, done: !d.done } : d,
                  ),
                }
              : p,
          ),
        })),
      removeDeliverable: (projectId, deliverableId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, deliverables: p.deliverables.filter((d) => d.id !== deliverableId) }
              : p,
          ),
        })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addTask: (t) => {
        const item: Task = { ...t, id: uid(), done: false, createdAt: new Date().toISOString() };
        set((s) => ({ tasks: [item, ...s.tasks] }));
        get().addNotification({ kind: "task", title: "New task", body: item.title, link: "/tasks" });
        return item;
      },
      toggleTask: (id) => {
        const prev = get().tasks.find((t) => t.id === id);
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
        if (prev && !prev.done) {
          get().addNotification({ kind: "task_done", title: "Task completed", body: prev.title, link: "/tasks" });
        }
      },
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addNote: (n) => {
        const item: Note = { ...n, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ notes: [item, ...s.notes] }));
        return item;
      },
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addInvoice: (i) => {
        const clientUserId = i.clientUserId ?? resolveClientUserId(get().clientUsers, { email: i.clientEmail, name: i.clientName });
        const item: Invoice = { ...i, clientUserId, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ invoices: [item, ...s.invoices] }));
        get().addNotification({ kind: "invoice", title: "Invoice created", body: item.number ? `#${item.number} · ${item.clientName}` : item.clientName, link: "/invoices" });
        return item;
      },
      updateInvoice: (id, patch) =>
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      setInvoiceStatus: (id, status) => {
        const prev = get().invoices.find((i) => i.id === id);
        set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)) }));
        if (prev && status === "paid" && prev.status !== "paid") {
          get().addNotification({ kind: "invoice_paid", title: "Invoice paid ✅", body: `#${prev.number} · ${prev.clientName}`, link: "/invoices" });
        }
      },
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

      addLead: (l) => {
        const item: Lead = { ...l, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ leads: [item, ...s.leads] }));
        get().addNotification({ kind: "lead", title: "New lead captured", body: item.name, link: "/leads" });
        return item;
      },
      updateLead: (id, patch) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      setLeadStatus: (id, status) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),

      addProposal: (p) => {
        const item: Proposal = { ...p, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ proposals: [item, ...s.proposals] }));
        get().addNotification({ kind: "proposal", title: "New proposal", body: item.title, link: "/proposals" });
        return item;
      },
      updateProposal: (id, patch) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProposalStatus: (id, status) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status } : p)) })),
      deleteProposal: (id) => set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) })),

      addContract: (c) => {
        const clientUserId = c.clientUserId ?? resolveClientUserId(get().clientUsers, { email: c.clientEmail, name: c.clientName });
        const item: Contract = { ...c, clientUserId, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ contracts: [item, ...s.contracts] }));
        get().addNotification({ kind: "contract", title: "New contract", body: item.title, link: "/contracts" });
        return item;
      },
      updateContract: (id, patch) =>
        set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      setContractStatus: (id, status) =>
        set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? { ...c, status } : c)) })),
      deleteContract: (id) => set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) })),

      addTicket: (t) => {
        const item: SupportTicket = { ...t, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ tickets: [item, ...s.tickets] }));
        get().addNotification({ kind: "ticket", title: "New support ticket", body: item.subject, link: "/support" });
        return item;
      },
      updateTicket: (id, patch) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      setTicketStatus: (id, status) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) })),
      deleteTicket: (id) => set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),

      addCampaign: (c) => {
        const item: EmailCampaign = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ campaigns: [item, ...s.campaigns] }));
        get().addNotification({ kind: "campaign", title: "New email campaign", body: item.name, link: "/email-marketing" });
        return item;
      },
      updateCampaign: (id, patch) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      setCampaignStatus: (id, status) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) })),
      deleteCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),

      addClientUser: (c) => {
        const item: ClientUser = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ clientUsers: [item, ...s.clientUsers] }));
        void pushClientUser(item);
        return item;
      },
      updateClientUser: (id, patch) => {
        set((s) => ({ clientUsers: s.clientUsers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        const updated = get().clientUsers.find((c) => c.id === id);
        if (updated) void pushClientUser(updated);
      },
      deleteClientUser: (id) => {
        set((s) => ({ clientUsers: s.clientUsers.filter((c) => c.id !== id) }));
        void deleteClientUserRemote(id);
      },
      resendClientInvite: (id) => {
        const user = get().clientUsers.find((c) => c.id === id);
        if (!user) return { ok: false, error: "Client user not found" };
        const now = new Date().toISOString();
        const patch: Partial<ClientUser> = {
          lastInvitedAt: now,
          inviteCount: (user.inviteCount ?? 0) + 1,
          status: user.status === "active" ? user.status : "invited",
        };
        set((s) => ({
          clientUsers: s.clientUsers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        const updated = get().clientUsers.find((c) => c.id === id);
        if (updated) void pushClientUser(updated);
        get().addNotification({
          kind: "system",
          title: "Invite resent",
          body: `Invitation email queued for ${user.email}`,
          link: "/customers/client-users",
        });
        return { ok: true, user: { ...user, ...patch } };
      },

      hydrateClientUsersFromCloud: async () => {
        const remote = await fetchAllClientUsers();
        if (!remote) return;
        set((s) => ({ clientUsers: mergeClientUsers(s.clientUsers, remote) }));
      },

      clientSignup: (input) => {
        const emailNorm = input.email.trim().toLowerCase();
        if (!emailNorm || !input.password || input.password.length < 6) {
          return { ok: false, error: "Enter a valid email and a password (min 6 chars)." };
        }
        if (get().clientUsers.some((c) => c.email.trim().toLowerCase() === emailNorm)) {
          return { ok: false, error: "An account with that email already exists." };
        }
        const item: ClientUser = {
          id: uid(),
          name: input.name.trim() || emailNorm,
          email: emailNorm,
          password: input.password,
          phone: input.phone,
          companyName: input.companyName,
          status: "active",
          permissions: { dashboard: true, projects: true, invoices: true, contracts: true, payments: true, spending: true, proposals: true, reports: true, services: true, support: true, settings: true, consultation: true },
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clientUsers: [item, ...s.clientUsers], currentClientUserId: item.id }));
        void pushClientUser(item);
        get().addNotification({ kind: "company", title: "New client signup", body: `${item.name} (${item.email})`, link: "/customers/client-users" });
        return { ok: true, user: item };
      },
      clientLogin: (email, password) => {
        const emailNorm = email.trim().toLowerCase();
        const match = () =>
          get().clientUsers.find(
            (c) => c.email.trim().toLowerCase() === emailNorm && c.password === password,
          );
        let user = match();
        if (!user) {
          // Fire-and-forget cloud refresh so a client who signed up on another
          // device can log in on the next attempt.
          void get().hydrateClientUsersFromCloud();
          return { ok: false, error: "Invalid email or password." };
        }
        if (user.status === "suspended") return { ok: false, error: "Account is suspended. Contact support." };
        set({ currentClientUserId: user.id });
        return { ok: true };
      },
      clientLogout: () => set({ currentClientUserId: null }),
      setCurrentClientUser: (id) => set({ currentClientUserId: id }),
      updateCurrentClientUser: (patch) => {
        const id = get().currentClientUserId;
        if (!id) return;
        set((s) => ({ clientUsers: s.clientUsers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        const updated = get().clientUsers.find((c) => c.id === id);
        if (updated) void pushClientUser(updated);
      },
      requestClientPasswordReset: (email) => {
        const emailNorm = email.trim().toLowerCase();
        const user = get().clientUsers.find((c) => c.email.trim().toLowerCase() === emailNorm);
        if (!user) return { ok: false, error: "No client account with that email." };
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        set((s) => ({
          clientResetCodes: [
            ...s.clientResetCodes.filter((r) => r.userId !== user.id),
            { userId: user.id, code, expiresAt },
          ],
        }));
        return { ok: true, code };
      },
      resetClientPassword: (email, code, newPassword) => {
        const emailNorm = email.trim().toLowerCase();
        const user = get().clientUsers.find((c) => c.email.trim().toLowerCase() === emailNorm);
        if (!user) return { ok: false, error: "Invalid request." };
        const entry = get().clientResetCodes.find((r) => r.userId === user.id);
        if (!entry) return { ok: false, error: "Request a new code." };
        if (entry.code !== code) return { ok: false, error: "Incorrect code." };
        if (new Date(entry.expiresAt).getTime() < Date.now())
          return { ok: false, error: "Code expired. Request a new one." };
        if (newPassword.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
        set((s) => ({
          clientUsers: s.clientUsers.map((c) => (c.id === user.id ? { ...c, password: newPassword } : c)),
          clientResetCodes: s.clientResetCodes.filter((r) => r.userId !== user.id),
        }));
        const updated = get().clientUsers.find((c) => c.id === user.id);
        if (updated) void pushClientUser(updated);
        return { ok: true };
      },

      setEmailConfig: (patch) =>
        set((s) => ({ emailConfig: { ...s.emailConfig, ...patch } })),

      requestPasswordReset: (email) => {
        const emailNorm = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.trim().toLowerCase() === emailNorm);
        if (!user) return { ok: false, error: "No account with that email." };
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        set((s) => ({
          resetCodes: [
            ...s.resetCodes.filter((r) => r.userId !== user.id),
            { userId: user.id, code, expiresAt },
          ],
        }));
        return { ok: true, code };
      },
      verifyResetCode: (email, code) => {
        const emailNorm = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.trim().toLowerCase() === emailNorm);
        if (!user) return { ok: false, error: "Invalid request." };
        const entry = get().resetCodes.find((r) => r.userId === user.id);
        if (!entry) return { ok: false, error: "Request a new code." };
        if (entry.code !== code) return { ok: false, error: "Incorrect code." };
        if (new Date(entry.expiresAt).getTime() < Date.now())
          return { ok: false, error: "Code expired. Request a new one." };
        return { ok: true };
      },
      resetPassword: (email, code, newPassword) => {
        const verify = get().verifyResetCode(email, code);
        if (!verify.ok) return verify;
        const emailNorm = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.trim().toLowerCase() === emailNorm);
        if (!user) return { ok: false, error: "Invalid request." };
        set((s) => ({
          users: s.users.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u)),
          resetCodes: s.resetCodes.filter((r) => r.userId !== user.id),
        }));
        return { ok: true };
      },

      setSetting: (section, key, value) =>
        set((s) => ({
          moduleSettings: {
            ...s.moduleSettings,
            [section]: { ...(s.moduleSettings[section] ?? {}), [key]: value },
          },
        })),
      setSettings: (section, patch) =>
        set((s) => ({
          moduleSettings: {
            ...s.moduleSettings,
            [section]: { ...(s.moduleSettings[section] ?? {}), ...patch },
          },
        })),
      getSetting: (section, key, fallback) => {
        const v = get().moduleSettings[section]?.[key];
        return v === undefined ? fallback : v;
      },

      getList: (listKey) => get().lists[listKey] ?? [],
      addListItem: (listKey, item) => {
        const it: ListItem = { ...item, id: uid() };
        set((s) => ({
          lists: { ...s.lists, [listKey]: [...(s.lists[listKey] ?? []), it] },
        }));
        return it;
      },
      updateListItem: (listKey, id, patch) =>
        set((s) => ({
          lists: {
            ...s.lists,
            [listKey]: (s.lists[listKey] ?? []).map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          },
        })),
      deleteListItem: (listKey, id) =>
        set((s) => ({
          lists: {
            ...s.lists,
            [listKey]: (s.lists[listKey] ?? []).filter((it) => it.id !== id),
          },
        })),
      reorderList: (listKey, ids) =>
        set((s) => {
          const map = new Map((s.lists[listKey] ?? []).map((it) => [it.id, it]));
          const next = ids.map((id, i) => {
            const it = map.get(id);
            return it ? { ...it, order: i } : null;
          }).filter(Boolean) as ListItem[];
          return { lists: { ...s.lists, [listKey]: next } };
        }),

      pushErrorLog: (message, level = "info") =>
        set((s) => ({
          errorLogs: [
            { id: uid(), message, level, at: new Date().toISOString() },
            ...s.errorLogs,
          ].slice(0, 200),
        })),
      clearErrorLogs: () => set({ errorLogs: [] }),
      logExport: (entry) => {
        const s = get();
        const user = s.users.find((u) => u.id === s.currentUserId);
        const rec = {
          id: uid(),
          at: new Date().toISOString(),
          userId: user?.id ?? null,
          userName: user?.name ?? "Unknown",
          ...entry,
        };
        set((st) => ({ exportHistory: [rec, ...st.exportHistory].slice(0, 500) }));
      },
      clearExportHistory: () => set({ exportHistory: [] }),
      clearCache: () => {
        try {
          sessionStorage.clear();
        } catch {}
        set((s) => ({
          errorLogs: [
            { id: uid(), message: "Cache cleared", level: "info" as const, at: new Date().toISOString() },
            ...s.errorLogs,
          ].slice(0, 200),
        }));
      },

      addServiceRequest: (r) => {
        const now = new Date().toISOString();
        const status = r.status ?? "new";
        const item: ServiceRequest = {
          ...r,
          id: uid(),
          status,
          createdAt: now,
          updatedAt: now,
          history: [{ at: now, status, note: "Request submitted" }],
        };
        set((s) => ({ serviceRequests: [item, ...s.serviceRequests] }));
        get().addNotification({
          kind: "system",
          title: "New service request",
          body: `${item.clientName} · ${item.title}${item.budget ? ` · $${Number(item.budget).toLocaleString()}` : ""}`,
          link: "/service-requests",
        });
        return item;
      },
      updateServiceRequest: (id, patch) =>
        set((s) => ({
          serviceRequests: s.serviceRequests.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
        })),
      setServiceRequestStatus: (id, status) =>
        set((s) => ({
          serviceRequests: s.serviceRequests.map((r) => {
            if (r.id !== id) return r;
            const at = new Date().toISOString();
            const history = [...(r.history ?? []), { at, status }];
            return { ...r, status, updatedAt: at, history };
          }),
        })),
      deleteServiceRequest: (id) =>
        set((s) => ({ serviceRequests: s.serviceRequests.filter((r) => r.id !== id) })),

      addClientReport: (r) => {
        const item: ClientReport = {
          ...r,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clientReports: [item, ...s.clientReports] }));
        get().addNotification({
          kind: "system",
          title: "New client report",
          body: `${item.clientName} · ${item.title}`,
          link: "/reports",
        });
        return item;
      },
      updateClientReport: (id, patch) =>
        set((s) => ({
          clientReports: s.clientReports.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteClientReport: (id) =>
        set((s) => ({ clientReports: s.clientReports.filter((r) => r.id !== id) })),

      addConsultationBooking: (b) => {
        const item: ConsultationBooking = {
          ...b,
          status: b.status ?? "requested",
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ consultationBookings: [item, ...(s.consultationBookings ?? [])] }));
        get().addNotification({
          kind: "ticket",
          title: "New consultation request",
          body: `${item.clientName}${item.topic ? " · " + item.topic : ""}`,
          link: "/portal/consultation",
        });
        return item;
      },
      updateConsultationBooking: (id, patch) =>
        set((s) => ({
          consultationBookings: (s.consultationBookings ?? []).map((b) =>
            b.id === id ? { ...b, ...patch } : b,
          ),
        })),
      setConsultationStatus: (id, status) =>
        set((s) => ({
          consultationBookings: (s.consultationBookings ?? []).map((b) =>
            b.id === id ? { ...b, status } : b,
          ),
        })),
      deleteConsultationBooking: (id) =>
        set((s) => ({
          consultationBookings: (s.consultationBookings ?? []).filter((b) => b.id !== id),
        })),
    }),
    {
      name: "metaedge-crm-v6",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CRMState>;
        return { ...current, ...p, ...{
          lists: p.lists ?? current.lists ?? {},
          serviceRequests: p.serviceRequests ?? [],
          consultationBookings: p.consultationBookings ?? [],
          clientReports: p.clientReports ?? [],
          proposals: (p as any).proposals ?? (current as any).proposals ?? [],
          notifications: p.notifications ?? [],
          exportHistory: p.exportHistory ?? [],
          errorLogs: p.errorLogs ?? [],
          clientUsers: p.clientUsers ?? current.clientUsers ?? [],
          users: p.users ?? current.users ?? [],
        } } as CRMState & Actions;
      },
    },
  ),
);

export const permissionLabels: Record<keyof Permissions, string> = {
  contacts: "Contacts",
  deals: "Deals",
  projects: "Projects",
  tasks: "Tasks",
  invoices: "Invoices",
  leads: "Leads",
  proposals: "Proposals",
  contracts: "Contracts",
  support: "Support",
  emailMarketing: "Email Marketing",
  clientUsers: "Client Users",
  settings: "Settings",
};