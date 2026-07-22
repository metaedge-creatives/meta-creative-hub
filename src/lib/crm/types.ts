export type Module =
  | "contacts"
  | "deals"
  | "projects"
  | "tasks"
  | "invoices"
  | "leads"
  | "proposals"
  | "contracts"
  | "support"
  | "emailMarketing"
  | "clientUsers"
  | "settings";

export interface Permissions {
  contacts: boolean;
  deals: boolean;
  projects: boolean;
  tasks: boolean;
  invoices: boolean;
  leads: boolean;
  proposals: boolean;
  contracts: boolean;
  support: boolean;
  emailMarketing: boolean;
  clientUsers: boolean;
  settings: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  permissions: Permissions;
  password: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  // Extended client fields
  firstName?: string;
  lastName?: string;
  email?: string;
  category?: string;
  description?: string;
  billingAddress?: string;
  shippingAddress?: string;
  invoiceDueDays?: number;
  appModules?: string[];
  moreInformation?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export interface Deal {
  id: string;
  title: string;
  companyId?: string;
  contactId?: string;
  value: number;
  stage: DealStage;
  expectedClose?: string;
  ownerId?: string;
  notes?: string;
  createdAt: string;
}

export type ProjectStatus = "brief" | "in_progress" | "review" | "delivered";

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "delivered", label: "Delivered" },
];

export interface Deliverable {
  id: string;
  title: string;
  done: boolean;
}

export type ProjectBilling = "hourly" | "fixed" | "fee";

export interface ProjectPermissions {
  taskCollab?: boolean;
  clientViewTasks?: boolean;
  clientTaskParticipation?: boolean;
  clientCreateTasks?: boolean;
  clientChecklist?: boolean;
  clientViewTimesheets?: boolean;
  clientViewExpenses?: boolean;
}

export interface Project {
  id: string;
  name: string;
  brief?: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  status: ProjectStatus;
  deadline?: string;
  ownerId?: string;
  deliverables: Deliverable[];
  createdAt: string;
  clientKind?: "new" | "existing";
  template?: string;
  startDate?: string;
  tags?: string[];
  category?: string;
  assignedUserIds?: string[];
  managerIds?: string[];
  progressManual?: boolean;
  progress?: number;
  billing?: ProjectBilling;
  estimatedHours?: number;
  estimatedCosts?: number;
  permissions?: ProjectPermissions;
  moreInfo?: string;
}

export type ParentType = "contact" | "company" | "deal" | "project";

export type TaskStatus = "new" | "in_progress" | "awaiting_feedback" | "completed";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface ChecklistItem { id: string; title: string; done: boolean }
export interface TaskComment { id: string; authorId: string; body: string; at: string }
export interface TimeEntry { id: string; userId: string; startedAt: string; endedAt?: string; seconds: number; note?: string }

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
  assigneeId?: string;
  parentType?: ParentType;
  parentId?: string;
  createdAt: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserIds?: string[];
  clientContactId?: string;
  description?: string;
  moreInfo?: string;
  tags?: string[];
  visibleToClient?: boolean;
  billable?: boolean;
  checklist?: ChecklistItem[];
  comments?: TaskComment[];
  timeEntries?: TimeEntry[];
  attachments?: string[];
}

export interface Note {
  id: string;
  body: string;
  authorId: string;
  parentType: ParentType;
  parentId: string;
  createdAt: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export const INVOICE_STATUSES: { id: InvoiceStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
  { id: "cancelled", label: "Cancelled" },
];

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  companyId?: string;
  contactId?: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  taxRate: number;
  discount: number;
  notes?: string;
  items: InvoiceLineItem[];
  status: InvoiceStatus;
  createdAt: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified" | "proposal_sent" | "converted";
export const LEAD_STATUSES: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "disqualified", label: "Disqualified" },
  { id: "proposal_sent", label: "Proposal Sent" },
  { id: "converted", label: "Converted" },
];

export interface Lead {
  id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  score: number;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  value?: number;
  assignedUserIds?: string[];
  category?: string;
  pinned?: boolean;
  starred?: boolean;
  archived?: boolean;
}

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected";
export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  value: number;
  status: ProposalStatus;
  content?: string;
  sentAt?: string;
  createdAt: string;
}

export type ContractStatus = "draft" | "sent" | "signed" | "expired" | "terminated";
export interface Contract {
  id: string;
  title: string;
  clientName: string;
  startDate?: string;
  endDate?: string;
  value: number;
  status: ContractStatus;
  notes?: string;
  createdAt: string;
}

export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export interface SupportTicket {
  id: string;
  subject: string;
  clientName: string;
  clientEmail?: string;
  priority: TicketPriority;
  status: TicketStatus;
  description?: string;
  createdAt: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sent";
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  audience: string;
  status: CampaignStatus;
  scheduledAt?: string;
  body?: string;
  createdAt: string;
}

export type ClientUserStatus = "invited" | "active" | "suspended";
export interface ClientPortalPermissions {
  dashboard: boolean;
  projects: boolean;
  invoices: boolean;
  contracts: boolean;
  payments: boolean;
  spending: boolean;
  proposals: boolean;
  reports: boolean;
  services: boolean;
  support: boolean;
  settings: boolean;
  consultation: boolean;
}
export interface ClientUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  companyId?: string;
  companyName?: string;
  avatarUrl?: string;
  address?: string;
  jobTitle?: string;
  permissions?: Partial<ClientPortalPermissions>;
  status: ClientUserStatus;
  createdAt: string;
}

export type ServiceRequestStatus = "new" | "reviewing" | "quoted" | "declined" | "converted";
export interface ServiceRequest {
  id: string;
  clientUserId: string;
  clientName: string;
  clientEmail?: string;
  productId?: string;
  title: string;
  description: string;
  budget?: number;
  status: ServiceRequestStatus;
  createdAt: string;
}

export type ClientReportPeriod = "weekly" | "monthly" | "custom";
export interface ClientReportMetric { label: string; value: string }
export interface ClientReport {
  id: string;
  clientName: string;
  period: ClientReportPeriod;
  title: string;
  summary: string;
  metrics?: ClientReportMetric[];
  projectId?: string;
  createdAt: string;
  sentAt?: string;
}

export type EmailProvider = "resend" | "sendgrid" | "mailgun" | "smtp" | "none";
export interface EmailConfig {
  provider: EmailProvider;
  apiKey?: string;
  fromName: string;
  fromEmail: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export interface PasswordResetCode {
  userId: string;
  code: string;
  expiresAt: string;
}

export interface ListItem {
  id: string;
  name: string;
  color?: string;
  description?: string;
  order?: number;
  meta?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  message: string;
  level: "info" | "warn" | "error";
  at: string;
}

export type NotificationKind =
  | "contact"
  | "company"
  | "deal"
  | "deal_won"
  | "project"
  | "task"
  | "task_done"
  | "invoice"
  | "invoice_paid"
  | "lead"
  | "proposal"
  | "contract"
  | "ticket"
  | "campaign"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  at: string;
}

export interface CRMState {
  users: User[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  invoices: Invoice[];
  leads: Lead[];
  proposals: Proposal[];
  contracts: Contract[];
  tickets: SupportTicket[];
  campaigns: EmailCampaign[];
  clientUsers: ClientUser[];
  emailConfig: EmailConfig;
  resetCodes: PasswordResetCode[];
  currentUserId: string | null;
  currentClientUserId: string | null;
  clientResetCodes: PasswordResetCode[];
  moduleSettings: Record<string, Record<string, any>>;
  lists: Record<string, ListItem[]>;
  errorLogs: ErrorLog[];
  notifications: AppNotification[];
  serviceRequests: ServiceRequest[];
  clientReports: ClientReport[];
}