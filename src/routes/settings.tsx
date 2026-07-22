import { createFileRoute, Link } from "@tanstack/react-router";

const EMPTY_ARR: any[] = [];
const EMPTY_OBJ: Record<string, any> = {};
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useCRM, permissionLabels } from "@/lib/crm/store";
import { useCurrentUser, useCan, initials } from "@/lib/crm/hooks";
import type { Permissions, ListItem } from "@/lib/crm/types";
import { PageHeader } from "@/components/crm/PageHeader";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users as UsersIcon, Mail, Layers, Settings2, ChevronDown, ChevronRight,
  Trash2, Plus, Search, Wrench, Download, Upload,
  RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, Info, Save,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · MetaEdge CRM" },
      { name: "description", content: "Every workspace setting in one place." },
    ],
  }),
  component: SettingsPage,
});

/* =========================================================================
   FIELD SCHEMA
   ========================================================================= */
type FieldType =
  | "text" | "textarea" | "number" | "email" | "password"
  | "toggle" | "select" | "color" | "date" | "time";

interface Field {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  help?: string;
  default?: any;
}

/* =========================================================================
   LEAF SECTION CONFIG
   ========================================================================= */
type LeafConfig =
  | { kind: "form"; section: string; description?: string; fields: Field[] }
  | { kind: "list"; listKey: string; description?: string; itemFields: Field[]; extraColumns?: { key: string; label: string }[] }
  | { kind: "component"; render: () => ReactElement };

interface Leaf { slug: string; label: string; config: LeafConfig; }
interface Group { slug: string; label: string; icon?: any; leaves: Leaf[]; }
interface Section { title: string; groups: Group[]; }

/* Common field shortcuts */
const nameColorFields: Field[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "color", label: "Color", type: "color", default: "#BF1833" },
];
const nameOnly: Field[] = [{ key: "name", label: "Name", type: "text" }];
const emailTemplateFields: Field[] = [
  { key: "name", label: "Template name", type: "text" },
  { key: "meta.subject", label: "Subject line", type: "text" },
  { key: "meta.body", label: "Body", type: "textarea" },
];
const customFieldFields: Field[] = [
  { key: "name", label: "Field label", type: "text" },
  { key: "meta.type", label: "Field type", type: "select", options: [
    { label: "Text", value: "text" }, { label: "Textarea", value: "textarea" },
    { label: "Number", value: "number" }, { label: "Date", value: "date" },
    { label: "Select", value: "select" }, { label: "Checkbox", value: "checkbox" },
  ], default: "text" },
  { key: "meta.required", label: "Required", type: "toggle" },
];

/* =========================================================================
   NAV TREE
   ========================================================================= */
const TREE: Section[] = [
  {
    title: "My Account",
    groups: [
      { slug: "profile", label: "My Profile", icon: UsersIcon, leaves: [
        { slug: "general", label: "Profile & Password", config: { kind: "component", render: () => <MyProfileSection /> }},
      ]},
    ],
  },
  {
    title: "Modules",
    groups: [
      { slug: "clients", label: "Clients", icon: UsersIcon, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "clients.general", fields: [
          { key: "autoAssign", label: "Auto-assign new clients to owner", type: "toggle", default: true },
          { key: "allowSignup", label: "Allow customers to sign up", type: "toggle" },
          { key: "enableShipping", label: "Enable shipping address", type: "toggle" },
          { key: "requirePhone", label: "Require phone number", type: "toggle" },
          { key: "defaultCurrency", label: "Default currency", type: "select", options: [
            {label:"USD",value:"USD"},{label:"EUR",value:"EUR"},{label:"GBP",value:"GBP"},{label:"PKR",value:"PKR"},{label:"INR",value:"INR"}
          ], default: "USD" },
          { key: "welcomeMessage", label: "Welcome message", type: "textarea" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "client.categories", itemFields: nameColorFields }},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "client.customFields", itemFields: customFieldFields }},
        { slug: "email-templates", label: "Email Templates", config: { kind: "list", listKey: "client.emailTemplates", itemFields: emailTemplateFields }},
      ]},
      { slug: "email", label: "Email", icon: Mail, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "email.general", fields: [
          { key: "fromName", label: "From name", type: "text", default: "MetaEdge Creatives" },
          { key: "fromEmail", label: "From email", type: "email", default: "info@metaedgecreatives.com" },
          { key: "replyTo", label: "Reply-to", type: "email" },
          { key: "footer", label: "Default footer", type: "textarea" },
          { key: "trackOpens", label: "Track opens", type: "toggle", default: true },
          { key: "trackClicks", label: "Track clicks", type: "toggle", default: true },
        ]}},
        { slug: "smtp", label: "SMTP Settings", config: { kind: "component", render: () => <SmtpSection /> }},
        { slug: "email-templates", label: "Email Templates", config: { kind: "list", listKey: "email.templates", itemFields: emailTemplateFields }},
        { slug: "email-queue", label: "Email Queue", config: { kind: "list", listKey: "email.queue", itemFields: [
          { key: "name", label: "Subject", type: "text" },
          { key: "meta.to", label: "Recipient", type: "email" },
          { key: "meta.status", label: "Status", type: "select", options: [
            { label: "Queued", value: "queued" }, { label: "Sending", value: "sending" },
            { label: "Sent", value: "sent" }, { label: "Failed", value: "failed" },
          ], default: "queued" },
        ]}},
        { slug: "email-log", label: "Email Log", config: { kind: "component", render: () => <EmailLogSection /> }},
      ]},
      { slug: "projects", label: "Projects", icon: Layers, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "projects.general", fields: [
          { key: "requireDeadline", label: "Require deadline", type: "toggle", default: true },
          { key: "defaultStatus", label: "Default status", type: "select", options: [
            {label:"Brief",value:"brief"},{label:"In Progress",value:"in_progress"},{label:"Review",value:"review"}
          ], default: "brief" },
          { key: "notifyOnStatusChange", label: "Notify team on status change", type: "toggle", default: true },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "project.categories", itemFields: nameColorFields }},
        { slug: "team-permissions", label: "Team Permissions", config: { kind: "form", section: "projects.teamPerms", fields: [
          { key: "canCreate", label: "Team can create projects", type: "toggle", default: true },
          { key: "canDelete", label: "Team can delete projects", type: "toggle" },
          { key: "canReassign", label: "Team can reassign owner", type: "toggle", default: true },
          { key: "canViewFinancials", label: "Team can view financials", type: "toggle" },
        ]}},
        { slug: "client-permissions", label: "Client Permissions", config: { kind: "form", section: "projects.clientPerms", fields: [
          { key: "canViewFiles", label: "Clients can view files", type: "toggle", default: true },
          { key: "canUpload", label: "Clients can upload files", type: "toggle" },
          { key: "canComment", label: "Clients can comment", type: "toggle", default: true },
          { key: "canViewMilestones", label: "Clients can view milestones", type: "toggle", default: true },
        ]}},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "project.customFields", itemFields: customFieldFields }},
      ]},
      { slug: "tasks", label: "Tasks", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "tasks.general", fields: [
          { key: "defaultReminder", label: "Default reminder (hours before due)", type: "number", default: 24 },
          { key: "showCompleted", label: "Show completed tasks by default", type: "toggle" },
          { key: "allowSubtasks", label: "Allow subtasks", type: "toggle", default: true },
        ]}},
        { slug: "statuses", label: "Statuses", config: { kind: "list", listKey: "task.statuses", itemFields: nameColorFields }},
        { slug: "priorities", label: "Priorities", config: { kind: "list", listKey: "task.priorities", itemFields: nameColorFields }},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "task.customFields", itemFields: customFieldFields }},
      ]},
      { slug: "leads", label: "Leads", icon: UsersIcon, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "leads.general", fields: [
          { key: "autoScore", label: "Enable auto-scoring", type: "toggle", default: true },
          { key: "convertToClient", label: "Convert to client on Won", type: "toggle", default: true },
          { key: "defaultOwner", label: "Default owner (email)", type: "email" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "lead.categories", itemFields: nameColorFields }},
        { slug: "stages", label: "Lead Stages", config: { kind: "list", listKey: "lead.stages", itemFields: nameColorFields }},
        { slug: "sources", label: "Lead Sources", config: { kind: "list", listKey: "lead.sources", itemFields: nameOnly }},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "lead.customFields", itemFields: customFieldFields }},
        { slug: "web-forms", label: "Web Forms", config: { kind: "list", listKey: "lead.webForms", itemFields: [
          { key: "name", label: "Form name", type: "text" },
          { key: "meta.embedUrl", label: "Embed URL slug", type: "text", placeholder: "e.g. contact" },
          { key: "meta.fields", label: "Fields (comma separated)", type: "textarea", placeholder: "name, email, message" },
          { key: "meta.enabled", label: "Enabled", type: "toggle", default: true },
        ]}},
        { slug: "email-templates", label: "Email Templates", config: { kind: "list", listKey: "lead.emailTemplates", itemFields: emailTemplateFields }},
      ]},
      { slug: "timesheets", label: "Time Sheets", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "timesheets.general", fields: [
          { key: "trackBillable", label: "Track billable hours", type: "toggle", default: true },
          { key: "roundTo", label: "Round to (minutes)", type: "number", default: 15 },
          { key: "requireApproval", label: "Require manager approval", type: "toggle" },
          { key: "defaultRate", label: "Default hourly rate", type: "number", default: 50 },
        ]}},
      ]},
      { slug: "milestones", label: "Milestones", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "milestones.general", fields: [
          { key: "notifyOnComplete", label: "Notify client on completion", type: "toggle", default: true },
          { key: "autoInvoice", label: "Auto-generate invoice on completion", type: "toggle" },
        ]}},
        { slug: "default-milestones", label: "Default Milestones", config: { kind: "list", listKey: "milestones.defaults", itemFields: [
          { key: "name", label: "Milestone", type: "text" },
          { key: "meta.days", label: "Days from project start", type: "number", default: 7 },
        ]}},
      ]},
      { slug: "invoices", label: "Invoices", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "invoices.general", fields: [
          { key: "prefix", label: "Invoice number prefix", type: "text", default: "MEC-" },
          { key: "nextNumber", label: "Next invoice number", type: "number", default: 1001 },
          { key: "defaultDueDays", label: "Default due (days)", type: "number", default: 14 },
          { key: "recurringDueDays", label: "Recurring invoice — due date allowance (days)", type: "number", default: 7 },
          { key: "defaultTax", label: "Default tax (%)", type: "number", default: 0 },
          { key: "terms", label: "Terms & conditions", type: "textarea" },
          { key: "footerNotes", label: "Footer notes", type: "textarea" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "invoice.categories", itemFields: nameColorFields }},
        { slug: "statuses", label: "Statuses", config: { kind: "list", listKey: "invoice.statuses", itemFields: nameColorFields }},
      ]},
      { slug: "estimates", label: "Estimates", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "estimates.general", fields: [
          { key: "prefix", label: "Estimate prefix", type: "text", default: "EST-" },
          { key: "validityDays", label: "Default validity (days)", type: "number", default: 30 },
          { key: "convertOnAccept", label: "Auto-convert to invoice on accept", type: "toggle", default: true },
          { key: "terms", label: "Terms & conditions", type: "textarea" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "estimate.categories", itemFields: nameColorFields }},
      ]},
      { slug: "products", label: "Products", icon: Layers, leaves: [
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "product.categories", itemFields: nameColorFields }},
        { slug: "units", label: "Units", config: { kind: "list", listKey: "product.units", itemFields: [
          { key: "name", label: "Unit name", type: "text", placeholder: "e.g. Hours, Pieces" },
          { key: "meta.short", label: "Short code", type: "text", placeholder: "hr" },
        ]}},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "product.customFields", itemFields: customFieldFields }},
      ]},
      { slug: "proposals", label: "Proposals", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "proposals.general", fields: [
          { key: "prefix", label: "Proposal prefix", type: "text", default: "PROP-" },
          { key: "requireSignature", label: "Require e-signature", type: "toggle", default: true },
          { key: "defaultValidity", label: "Default validity (days)", type: "number", default: 30 },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "proposal.categories", itemFields: nameColorFields }},
      ]},
      { slug: "contracts", label: "Contracts", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "contracts.general", fields: [
          { key: "prefix", label: "Contract prefix", type: "text", default: "CTR-" },
          { key: "renewReminder", label: "Renewal reminder (days before end)", type: "number", default: 30 },
          { key: "requireSignature", label: "Require e-signature", type: "toggle", default: true },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "contract.categories", itemFields: nameColorFields }},
      ]},
      { slug: "subscriptions", label: "Subscriptions", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "subscriptions.general", fields: [
          { key: "enabled", label: "Subscriptions enabled", type: "toggle", default: true },
          { key: "billingCycle", label: "Default billing cycle", type: "select", options: [
            {label:"Monthly",value:"monthly"},{label:"Quarterly",value:"quarterly"},{label:"Yearly",value:"yearly"}
          ], default: "monthly" },
          { key: "gracePeriod", label: "Grace period (days)", type: "number", default: 3 },
          { key: "autoRenew", label: "Auto-renew by default", type: "toggle", default: true },
        ]}},
      ]},
      { slug: "payments", label: "Payment Gateways", icon: CheckCircle2, leaves: [
        { slug: "paypal", label: "PayPal", config: { kind: "form", section: "payments.paypal", fields: [
          { key: "enabled", label: "Enable PayPal payment method", type: "toggle" },
          { key: "email", label: "PayPal email address", type: "email" },
          { key: "currency", label: "Currency code", type: "text", default: "USD" },
          { key: "displayName", label: "Display name (shown to clients)", type: "text", default: "PayPal" },
          { key: "ipnUrl", label: "IPN URL (paste into your PayPal profile)", type: "text", default: "https://crm.metaedgecreatives.com/api/paypal/ipn" },
          { key: "sandbox", label: "Sandbox mode (test transactions)", type: "toggle" },
        ]}},
        { slug: "stripe", label: "Stripe", config: { kind: "form", section: "payments.stripe", fields: [
          { key: "enabled", label: "Enable Stripe payment method", type: "toggle" },
          { key: "publishableKey", label: "Publishable key", type: "text" },
          { key: "secretKey", label: "Secret key", type: "password" },
          { key: "signingKey", label: "Webhook signing key", type: "password" },
          { key: "currency", label: "Currency code", type: "text", default: "USD" },
          { key: "displayName", label: "Display name (shown to clients)", type: "text", default: "Credit / Debit Card" },
          { key: "webhookUrl", label: "Webhook URL (paste into Stripe → Developers → Webhooks)", type: "text", default: "https://crm.metaedgecreatives.com/api/stripe/webhook" },
        ]}},
      ]},
      { slug: "expenses", label: "Expenses", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "expenses.general", fields: [
          { key: "billableByDefault", label: "Mark expense as billable by default", type: "toggle", default: true },
          { key: "requireReceipt", label: "Require receipt attachment", type: "toggle", default: true },
          { key: "approvalThreshold", label: "Approval threshold ($)", type: "number", default: 100 },
          { key: "reimburseCurrency", label: "Reimburse currency", type: "text", default: "USD" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "expense.categories", itemFields: nameColorFields }},
      ]},
      { slug: "tax", label: "Tax", icon: CheckCircle2, leaves: [
        { slug: "tax-rates", label: "Tax Rates", config: { kind: "list", listKey: "tax.rates", itemFields: [
          { key: "name", label: "Rate name", type: "text", placeholder: "e.g. GST 17%" },
          { key: "meta.rate", label: "Rate (%)", type: "number", default: 0 },
          { key: "meta.compound", label: "Compound", type: "toggle" },
        ]}},
      ]},
      { slug: "tags", label: "Tags", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "tags.general", fields: [
          { key: "allowAll", label: "Anyone can create tags", type: "toggle", default: true },
          { key: "maxPerRecord", label: "Max tags per record", type: "number", default: 10 },
        ]}},
        { slug: "view-tags", label: "View Tags", config: { kind: "list", listKey: "tags.all", itemFields: nameColorFields }},
      ]},
      { slug: "tickets", label: "Tickets", icon: CheckCircle2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "tickets.general", fields: [
          { key: "autoAssign", label: "Auto-assign by department", type: "toggle", default: true },
          { key: "slaHours", label: "Default SLA (hours)", type: "number", default: 24 },
          { key: "notifyOnReply", label: "Notify assignee on reply", type: "toggle", default: true },
          { key: "closeAfterDays", label: "Auto-close resolved after (days)", type: "number", default: 7 },
        ]}},
        { slug: "departments", label: "Departments", config: { kind: "list", listKey: "tickets.departments", itemFields: [
          { key: "name", label: "Department", type: "text" },
          { key: "meta.email", label: "Inbox email", type: "email" },
          { key: "color", label: "Color", type: "color", default: "#BF1833" },
        ]}},
        { slug: "statuses", label: "Statuses", config: { kind: "list", listKey: "tickets.statuses", itemFields: nameColorFields }},
        { slug: "canned-categories", label: "Canned Categories", config: { kind: "list", listKey: "tickets.canned", itemFields: [
          { key: "name", label: "Category", type: "text" },
          { key: "meta.response", label: "Canned response", type: "textarea" },
        ]}},
        { slug: "custom-fields", label: "Custom Fields", config: { kind: "list", listKey: "tickets.customFields", itemFields: customFieldFields }},
      ]},
      { slug: "user-roles", label: "User Roles", icon: ShieldCheck, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "component", render: () => <UserRolesSection /> }},
      ]},
      { slug: "files", label: "Files", icon: Layers, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "files.general", fields: [
          { key: "maxSizeMb", label: "Max upload size (MB)", type: "number", default: 25 },
          { key: "allowedTypes", label: "Allowed types (comma separated)", type: "text", default: "pdf,doc,docx,png,jpg,jpeg,mp4" },
          { key: "watermark", label: "Watermark preview files", type: "toggle" },
        ]}},
        { slug: "folders", label: "Folders", config: { kind: "list", listKey: "files.folders", itemFields: nameOnly }},
        { slug: "default-folders", label: "Default Folders", config: { kind: "list", listKey: "files.defaultFolders", itemFields: [
          { key: "name", label: "Folder name", type: "text" },
          { key: "meta.scope", label: "Applies to", type: "select", options: [
            {label:"Every project",value:"project"},{label:"Every client",value:"client"},{label:"Every lead",value:"lead"}
          ], default: "project" },
        ]}},
      ]},
      { slug: "knowledgebase", label: "Knowledgebase", icon: Layers, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "kb.general", fields: [
          { key: "public", label: "Publicly accessible", type: "toggle", default: true },
          { key: "allowRatings", label: "Allow article ratings", type: "toggle", default: true },
          { key: "showAuthor", label: "Show article author", type: "toggle" },
        ]}},
        { slug: "categories", label: "Categories", config: { kind: "list", listKey: "kb.categories", itemFields: nameColorFields }},
      ]},
      { slug: "other", label: "Other", icon: Wrench, leaves: [
        { slug: "updates", label: "Updates", config: { kind: "component", render: () => <UpdatesSection /> }},
        { slug: "system-information", label: "System Information", config: { kind: "component", render: () => <SystemInfoSection /> }},
        { slug: "recaptcha", label: "reCAPTCHA", config: { kind: "form", section: "other.recaptcha", fields: [
          { key: "enabled", label: "Enable reCAPTCHA on public forms", type: "toggle" },
          { key: "siteKey", label: "Site key", type: "text" },
          { key: "secretKey", label: "Secret key", type: "password" },
          { key: "version", label: "Version", type: "select", options: [
            {label:"v2 Checkbox",value:"v2"},{label:"v3 Invisible",value:"v3"}
          ], default: "v3" },
        ]}},
        { slug: "tweak", label: "Tweak", config: { kind: "form", section: "other.tweak", fields: [
          { key: "showBranding", label: "Show MetaEdge branding", type: "toggle", default: true },
          { key: "compactSidebar", label: "Compact sidebar by default", type: "toggle" },
          { key: "beta", label: "Enable beta features", type: "toggle" },
          { key: "customCss", label: "Custom CSS", type: "textarea" },
        ]}},
      ]},
    ],
  },
  {
    title: "Main Settings",
    groups: [
      { slug: "main", label: "Main Settings", icon: Settings2, leaves: [
        { slug: "general", label: "General Settings", config: { kind: "form", section: "main.general", fields: [
          { key: "siteName", label: "Site name", type: "text", default: "MetaEdge CRM" },
          { key: "domain", label: "Domain", type: "text", default: "crm.metaedgecreatives.com" },
          { key: "language", label: "Default language", type: "select", options: [
            {label:"English",value:"en"},{label:"Urdu",value:"ur"},{label:"Spanish",value:"es"},{label:"French",value:"fr"},{label:"German",value:"de"}
          ], default: "en" },
          { key: "timezone", label: "Timezone", type: "text", default: "Asia/Karachi" },
          { key: "dateFormat", label: "Date format", type: "select", options: [
            {label:"YYYY-MM-DD",value:"YYYY-MM-DD"},{label:"DD/MM/YYYY",value:"DD/MM/YYYY"},{label:"MM/DD/YYYY",value:"MM/DD/YYYY"}
          ], default: "DD/MM/YYYY" },
          { key: "weekStart", label: "Week starts on", type: "select", options: [
            {label:"Monday",value:"mon"},{label:"Sunday",value:"sun"}
          ], default: "mon" },
        ]}},
        { slug: "company-details", label: "Company Details", config: { kind: "form", section: "main.company", fields: [
          { key: "name", label: "Company name", type: "text", default: "MetaEdge Creatives" },
          { key: "email", label: "Contact email", type: "email", default: "info@metaedgecreatives.com" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "website", label: "Website", type: "text", default: "metaedgecreatives.com" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "taxId", label: "Tax / VAT ID", type: "text" },
        ]}},
        { slug: "currency", label: "Currency", config: { kind: "form", section: "main.currency", fields: [
          { key: "code", label: "Currency code", type: "select", options: [
            {label:"USD",value:"USD"},{label:"EUR",value:"EUR"},{label:"GBP",value:"GBP"},{label:"PKR",value:"PKR"},{label:"INR",value:"INR"},{label:"AED",value:"AED"}
          ], default: "USD" },
          { key: "symbol", label: "Symbol", type: "text", default: "$" },
          { key: "position", label: "Symbol position", type: "select", options: [
            {label:"Before amount",value:"before"},{label:"After amount",value:"after"}
          ], default: "before" },
          { key: "decimals", label: "Decimal places", type: "number", default: 2 },
          { key: "thousandsSep", label: "Thousands separator", type: "text", default: "," },
        ]}},
        { slug: "theme", label: "Theme", config: { kind: "component", render: () => <ThemeSection /> }},
        { slug: "company-logo", label: "Company Logo", config: { kind: "component", render: () => <CompanyLogoSection /> }},
        { slug: "modules", label: "Modules", config: { kind: "component", render: () => <ModulesToggleSection /> }},
        { slug: "cron", label: "Cron Job Settings", config: { kind: "form", section: "main.cron", fields: [
          { key: "enabled", label: "Enable scheduled jobs", type: "toggle", default: true },
          { key: "cronUrl", label: "Cron ping URL", type: "text", default: "https://crm.metaedgecreatives.com/api/cron" },
          { key: "frequency", label: "Frequency", type: "select", options: [
            {label:"Every 5 minutes",value:"5m"},{label:"Hourly",value:"1h"},{label:"Daily",value:"1d"}
          ], default: "1h" },
          { key: "sendReminders", label: "Send task reminders", type: "toggle", default: true },
          { key: "runAutomations", label: "Run automations", type: "toggle", default: true },
        ]}},
        { slug: "clear-cache", label: "Clear Cache", config: { kind: "component", render: () => <ClearCacheSection /> }},
        { slug: "error-logs", label: "Error Logs", config: { kind: "component", render: () => <ErrorLogsSection /> }},
      ]},
      { slug: "team", label: "Team & Data", icon: UsersIcon, leaves: [
        { slug: "team", label: "Team & Permissions", config: { kind: "component", render: () => <TeamSection /> }},
        { slug: "email-api", label: "Email API", config: { kind: "component", render: () => <EmailApiSection /> }},
        { slug: "integrations", label: "Integrations", config: { kind: "component", render: () => <IntegrationsSection /> }},
        { slug: "cloud-sync", label: "Cloud Sync", config: { kind: "component", render: () => <CloudSyncSection /> }},
        { slug: "data", label: "Backup & Restore", config: { kind: "component", render: () => <DataSection /> }},
      ]},
    ],
  },
];

/* =========================================================================
   ROOT PAGE
   ========================================================================= */
function SettingsPage() {
  const can = useCan("settings");
  const [active, setActive] = useState<string>("my-account/profile/general");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "my-account/profile": true, "main-settings/main": true });
  const [q, setQ] = useState("");

  if (!can) return <NoAccess module="Settings" />;

  const filteredTree = useMemo(() => {
    if (!q.trim()) return TREE;
    const needle = q.toLowerCase();
    return TREE.map((sec) => ({
      ...sec,
      groups: sec.groups
        .map((g) => ({
          ...g,
          leaves: g.leaves.filter(
            (l) => l.label.toLowerCase().includes(needle) || g.label.toLowerCase().includes(needle),
          ),
        }))
        .filter((g) => g.leaves.length > 0),
    })).filter((sec) => sec.groups.length > 0);
  }, [q]);

  const activeLeaf = useMemo(() => {
    for (const sec of TREE)
      for (const g of sec.groups)
        for (const l of g.leaves) {
          const path = `${secKey(sec.title)}/${g.slug}/${l.slug}`;
          if (path === active) return { section: sec, group: g, leaf: l };
        }
    return null;
  }, [active]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/5 bg-white/90 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/20"
          >
            <ArrowLeft className="h-4 w-4" /> Back to CRM
          </Link>
          <div className="hidden md:block">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">MetaEdge Creatives</div>
            <div className="text-xl font-black" style={{ color: "#2A1418" }}>Settings</div>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/70">
          Workspace preferences
        </div>
      </header>
      <div className="px-8 pb-16 pt-6">
      <PageHeader title="Settings" subtitle="Every workspace preference in one place." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-divider bg-card brand-shadow">
            <div className="h-1 bg-primary" />
            <div className="p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#999" }} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings…" className="pl-8 text-[12px]" />
              </div>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-2 pb-3">
              {filteredTree.map((sec) => (
                <div key={sec.title} className="mb-3">
                  <div className="px-2 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "#999" }}>
                    {sec.title}
                  </div>
                  {sec.groups.map((g) => {
                    const gKey = `${secKey(sec.title)}/${g.slug}`;
                    const open = openGroups[gKey] ?? !!q;
                    const Icon = g.icon ?? Settings2;
                    return (
                      <div key={g.slug}>
                        <button
                          onClick={() => setOpenGroups((s) => ({ ...s, [gKey]: !open }))}
                          className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-bold hover:bg-muted"
                        >
                          {open ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5" style={{color:"#999"}} />}
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <span className="flex-1 truncate">{g.label}</span>
                        </button>
                        {open && (
                          <div className="ml-6 mt-0.5 space-y-0.5 border-l border-divider pl-2">
                            {g.leaves.map((l) => {
                              const path = `${gKey}/${l.slug}`;
                              const isActive = path === active;
                              return (
                                <button
                                  key={l.slug}
                                  onClick={() => setActive(path)}
                                  className={cn(
                                    "block w-full rounded-md px-2.5 py-1.5 text-left text-[12px] font-semibold transition",
                                    isActive ? "bg-accent text-primary" : "text-foreground/75 hover:bg-muted",
                                  )}
                                >
                                  {l.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {activeLeaf ? (
            <SectionCard title={`${activeLeaf.group.label} · ${activeLeaf.leaf.label}`} eyebrow={activeLeaf.section.title}>
              <LeafRenderer config={activeLeaf.leaf.config} />
            </SectionCard>
          ) : (
            <SectionCard title="Select a setting" eyebrow="Settings">
              <p className="text-[13px]" style={{ color: "#666" }}>Pick a section from the sidebar.</p>
            </SectionCard>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function secKey(title: string) { return title.toLowerCase().replace(/\s+/g, "-"); }

/* =========================================================================
   LAYOUT PRIMITIVES
   ========================================================================= */
function SectionCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-divider bg-card brand-shadow">
      <div className="h-1 bg-primary" />
      <div className="p-6">
        {eyebrow && (
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary">{eyebrow}</div>
        )}
        <div className="mb-5 text-xl font-black tracking-tight">{title}</div>
        {children}
      </div>
    </div>
  );
}

/* =========================================================================
   LEAF ROUTER
   ========================================================================= */
function LeafRenderer({ config }: { config: LeafConfig }) {
  if (config.kind === "form") return <GenericForm section={config.section} fields={config.fields} description={config.description} />;
  if (config.kind === "list") return <GenericList listKey={config.listKey} itemFields={config.itemFields} description={config.description} />;
  return config.render();
}

/* =========================================================================
   GENERIC FORM
   ========================================================================= */
function GenericForm({ section, fields, description }: { section: string; fields: Field[]; description?: string }) {
  const stored = useCRM((s) => s.moduleSettings[section]) ?? EMPTY_OBJ;
  const setSettings = useCRM((s) => s.setSettings);
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = { ...stored };
    for (const f of fields) if (init[f.key] === undefined && f.default !== undefined) init[f.key] = f.default;
    return init;
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings(section, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div>
      {description && <p className="mb-5 text-[13px]" style={{ color: "#666" }}>{description}</p>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {fields.map((f) => (
          <FieldEditor key={f.key} field={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
        <Button onClick={save} className="font-bold"><Save className="h-3.5 w-3.5" /> Save changes</Button>
      </div>
    </div>
  );
}

function FieldEditor({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  const t = field.type ?? "text";
  const commonWrap = "space-y-1.5";
  if (t === "toggle") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-divider bg-background px-4 py-3">
        <div>
          <div className="text-[13px] font-bold">{field.label}</div>
          {field.help && <div className="text-[11px]" style={{color:"#999"}}>{field.help}</div>}
        </div>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (t === "select") {
    return (
      <div className={commonWrap}>
        <Label>{field.label}</Label>
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={field.placeholder ?? "Select…"} /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (t === "textarea") {
    return (
      <div className={cn(commonWrap, "md:col-span-2")}>
        <Label>{field.label}</Label>
        <Textarea rows={4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      </div>
    );
  }
  if (t === "color") {
    return (
      <div className={commonWrap}>
        <Label>{field.label}</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={value ?? "#BF1833"} onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-divider bg-background" />
          <Input value={value ?? "#BF1833"} onChange={(e) => onChange(e.target.value)} className="flex-1" />
        </div>
      </div>
    );
  }
  return (
    <div className={commonWrap}>
      <Label>{field.label}</Label>
      <Input
        type={t === "number" ? "number" : t === "email" ? "email" : t === "password" ? "password" : t === "date" ? "date" : t === "time" ? "time" : "text"}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(t === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      />
      {field.help && <div className="text-[11px]" style={{color:"#999"}}>{field.help}</div>}
    </div>
  );
}

/* =========================================================================
   GENERIC LIST
   ========================================================================= */
function GenericList({ listKey, itemFields, description }: { listKey: string; itemFields: Field[]; description?: string }) {
  const items = useCRM((s) => s.lists[listKey]) ?? EMPTY_ARR;
  const addListItem = useCRM((s) => s.addListItem);
  const updateListItem = useCRM((s) => s.updateListItem);
  const deleteListItem = useCRM((s) => s.deleteListItem);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ListItem | null>(null);

  const seed = () => {
    const init: any = { meta: {} };
    for (const f of itemFields) {
      if (f.default !== undefined) {
        if (f.key.startsWith("meta.")) init.meta[f.key.slice(5)] = f.default;
        else init[f.key] = f.default;
      }
    }
    return init;
  };

  const [form, setForm] = useState<any>(seed);

  const openNew = () => { setEditing(null); setForm(seed()); setOpen(true); };
  const openEdit = (it: ListItem) => { setEditing(it); setForm({ ...it, meta: it.meta ?? {} }); setOpen(true); };
  const submit = () => {
    const payload: Omit<ListItem, "id"> = {
      name: form.name ?? "",
      color: form.color,
      description: form.description,
      meta: form.meta ?? {},
    };
    if (!payload.name?.trim()) return;
    if (editing) updateListItem(listKey, editing.id, payload);
    else addListItem(listKey, payload);
    setOpen(false);
  };

  const getVal = (f: Field, obj: any) => f.key.startsWith("meta.") ? obj?.meta?.[f.key.slice(5)] : obj?.[f.key];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        {description ? <p className="text-[13px]" style={{ color: "#666" }}>{description}</p> : <div />}
        <NewButton onClick={openNew}><Plus className="h-3.5 w-3.5" /> Add</NewButton>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-divider bg-background px-6 py-12 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm font-bold">No items yet</div>
          <div className="mt-1 text-[12px]" style={{ color: "#999" }}>Add your first entry to get started.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-divider">
          <table className="w-full text-sm">
            <thead className="border-b border-divider bg-muted/40 text-[10px] uppercase tracking-[0.12em]" style={{ color: "#666" }}>
              <tr>
                {itemFields.map((f) => <th key={f.key} className="px-4 py-3 text-left font-bold">{f.label}</th>)}
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-divider last:border-0 hover:bg-muted/30">
                  {itemFields.map((f) => {
                    const v = getVal(f, it);
                    return (
                      <td key={f.key} className="px-4 py-3">
                        {f.type === "color" ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-block h-4 w-4 rounded-full border border-divider" style={{ background: v || "#BF1833" }} />
                            <span className="text-[11px]" style={{color:"#999"}}>{v || "—"}</span>
                          </span>
                        ) : f.type === "toggle" ? (
                          v ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <span className="text-[11px]" style={{color:"#999"}}>Off</span>
                        ) : (
                          <span className={f.key === "name" ? "font-bold" : ""}>{String(v ?? "—")}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(it)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this item?")) deleteListItem(listKey, it.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {itemFields.map((f) => {
              const v = f.key.startsWith("meta.") ? form.meta?.[f.key.slice(5)] : form[f.key];
              return (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={v}
                  onChange={(val) => {
                    if (f.key.startsWith("meta.")) setForm({ ...form, meta: { ...(form.meta ?? {}), [f.key.slice(5)]: val } });
                    else setForm({ ...form, [f.key]: val });
                  }}
                />
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="font-bold">{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================
   CUSTOM SECTIONS
   ========================================================================= */

/* -------- Team & Permissions -------- */
const MODULES: (keyof Permissions)[] = [
  "contacts","deals","projects","tasks","invoices","leads","proposals","contracts","support","emailMarketing","clientUsers","settings",
];

function TeamSection() {
  const users = useCRM((s) => s.users);
  const setUserPermission = useCRM((s) => s.setUserPermission);
  const updateUser = useCRM((s) => s.updateUser);
  const deleteUser = useCRM((s) => s.deleteUser);
  const currentUser = useCurrentUser();
  const isAdmin = !!currentUser?.isSuperAdmin;

  return (
    <div>
      <div className="mb-4 flex justify-end">{isAdmin && <NewUserDialog />}</div>
      <div className="overflow-x-auto rounded-xl border border-divider">
        <table className="w-full text-sm">
          <thead className="border-b border-divider bg-muted/40 text-[10px] uppercase tracking-[0.12em]" style={{color:"#666"}}>
            <tr>
              <th className="px-4 py-3 text-left font-bold">User</th>
              {MODULES.map((m) => <th key={m} className="px-2 py-3 text-center font-bold">{permissionLabels[m]}</th>)}
              <th className="px-2 py-3 text-center font-bold">Admin</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-divider last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-black text-primary">{initials(u.name)}</span>
                    <div>
                      <div className="text-sm font-black">{u.name}</div>
                      <div className="text-[11px]" style={{color:"#999"}}>{u.jobTitle ? `${u.jobTitle} · ` : ""}{u.email}</div>
                    </div>
                  </div>
                </td>
                {MODULES.map((m) => (
                  <td key={m} className="px-2 py-3 text-center">
                    <Switch checked={u.isSuperAdmin || u.permissions[m]} disabled={!isAdmin || u.isSuperAdmin}
                      onCheckedChange={(v) => setUserPermission(u.id, m, v)} />
                  </td>
                ))}
                <td className="px-2 py-3 text-center">
                  <Switch checked={u.isSuperAdmin}
                    disabled={!isAdmin || (u.isSuperAdmin && users.filter((x) => x.isSuperAdmin).length === 1)}
                    onCheckedChange={(v) => updateUser(u.id, { isSuperAdmin: v })} />
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => deleteUser(u.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">Remove</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewUserDialog() {
  const [open, setOpen] = useState(false);
  const addUser = useCRM((s) => s.addUser);
  const [form, setForm] = useState({ name: "", email: "", phone: "", jobTitle: "", password: "" });
  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    addUser({
      name: form.name.trim(), email: form.email.trim(),
      phone: form.phone || undefined, jobTitle: form.jobTitle || undefined,
      isSuperAdmin: false,
      permissions: { contacts:true,deals:true,projects:true,tasks:true,invoices:true,leads:true,proposals:true,contracts:true,support:true,emailMarketing:true,clientUsers:true,settings:false },
      password: form.password,
    });
    setForm({ name: "", email: "", phone: "", jobTitle: "", password: "" });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><NewButton>Add Team Member</NewButton></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} /></div>
          </div>
          <div><Label>Job title</Label><Input value={form.jobTitle} onChange={(e)=>setForm({...form,jobTitle:e.target.value})} /></div>
          <div><Label>Temporary password *</Label><Input value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="font-bold">Add member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------- SMTP Section -------- */
function SmtpSection() {
  const stored = useCRM((s) => s.emailConfig);
  const set = useCRM((s) => s.setEmailConfig);
  const [cfg, setCfg] = useState(stored);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setCfg(stored); /* refresh when store rehydrates */ }, [stored]);
  const update = (patch: any) => setCfg({ ...cfg, ...patch });
  const save = () => { set(cfg); setSaved(true); setTimeout(() => setSaved(false), 1600); };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div><Label>SMTP host</Label><Input value={cfg.smtpHost ?? ""} onChange={(e)=>update({smtpHost:e.target.value})} placeholder="smtp.yourhost.com" /></div>
        <div><Label>SMTP port</Label><Input type="number" value={cfg.smtpPort ?? 587} onChange={(e)=>update({smtpPort:Number(e.target.value)})} /></div>
        <div><Label>Username</Label><Input value={cfg.smtpUser ?? ""} onChange={(e)=>update({smtpUser:e.target.value})} /></div>
        <div><Label>Password</Label><Input type="password" value={cfg.smtpPass ?? ""} onChange={(e)=>update({smtpPass:e.target.value})} /></div>
        <div><Label>From name</Label><Input value={cfg.fromName} onChange={(e)=>update({fromName:e.target.value})} /></div>
        <div><Label>From email</Label><Input value={cfg.fromEmail} onChange={(e)=>update({fromEmail:e.target.value})} /></div>
        <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-divider bg-background px-4 py-3">
          <div><div className="text-[13px] font-bold">Provider</div><div className="text-[11px]" style={{color:"#999"}}>Select the API-based provider or SMTP.</div></div>
          <Select value={cfg.provider} onValueChange={(v)=>update({provider: v as any})}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Disabled</SelectItem>
              <SelectItem value="smtp">SMTP</SelectItem>
              <SelectItem value="resend">Resend</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="mailgun">Mailgun</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
        <Button onClick={save} className="font-bold"><Save className="h-3.5 w-3.5" /> Save changes</Button>
      </div>
    </div>
  );
}


/* -------- Email Log -------- */
function EmailLogSection() {
  const logs = useCRM((s) => s.lists["email.log"]) ?? EMPTY_ARR;
  const clear = useCRM((s) => s.deleteListItem);
  if (logs.length === 0) {
    return <p className="text-[13px]" style={{color:"#666"}}>No emails delivered yet. Sent campaigns and invoices will appear here.</p>;
  }
  return (
    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-lg border border-divider bg-background px-4 py-3">
          <div>
            <div className="text-sm font-bold">{l.name}</div>
            <div className="text-[11px]" style={{color:"#999"}}>{l.meta?.to} · {l.meta?.status}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => clear("email.log", l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}

/* -------- User Roles -------- */
function UserRolesSection() {
  const roles = useCRM((s) => s.lists["userRoles"]) ?? EMPTY_ARR;
  const addRole = useCRM((s) => s.addListItem);
  const delRole = useCRM((s) => s.deleteListItem);
  const [name, setName] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{color:"#666"}}>Define custom roles. Per-user module toggles live under Team & Data → Team & Permissions.</p>
      <div className="flex gap-2">
        <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Role name (e.g. Account Manager)" />
        <Button className="font-bold" onClick={() => { if (!name.trim()) return; addRole("userRoles", { name: name.trim() }); setName(""); }}>
          <Plus className="h-3.5 w-3.5" /> Add role
        </Button>
      </div>
      {roles.length > 0 && (
        <div className="rounded-xl border border-divider overflow-hidden">
          {roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-divider px-4 py-3 last:border-0">
              <span className="text-sm font-bold">{r.name}</span>
              <Button size="sm" variant="outline" onClick={() => delRole("userRoles", r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Updates -------- */
function UpdatesSection() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-primary/25 bg-accent p-4">
        <div className="mb-1 flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-primary">
          <Info className="h-3.5 w-3.5" /> Current version
        </div>
        <div className="text-2xl font-black">MetaEdge CRM v1.0.0</div>
        <div className="mt-1 text-[12px]" style={{color:"#666"}}>Deployed at crm.metaedgecreatives.com</div>
      </div>
      <Button variant="outline" className="font-bold"><RefreshCw className="h-3.5 w-3.5" /> Check for updates</Button>
      <div className="rounded-xl border border-divider bg-background p-4 text-[12px]" style={{color:"#666"}}>
        <div className="mb-1 font-bold text-foreground">What's new</div>
        Modular settings, invoice PDFs, password resets, and full glass UI.
      </div>
    </div>
  );
}

/* -------- System Information -------- */
function SystemInfoSection() {
  const usersCount = useCRM((s) => s.users.length);
  const companiesCount = useCRM((s) => s.companies.length);
  const projectsCount = useCRM((s) => s.projects.length);
  const invoicesCount = useCRM((s) => s.invoices.length);
  const leadsCount = useCRM((s) => s.leads.length);
  const ticketsCount = useCRM((s) => s.tickets.length);
  const info = [
    { k: "Domain", v: "crm.metaedgecreatives.com" },
    { k: "Environment", v: "Production" },
    { k: "App version", v: "1.0.0" },
    { k: "Storage", v: "Local (browser)" },
    { k: "Users", v: usersCount },
    { k: "Clients", v: companiesCount },
    { k: "Projects", v: projectsCount },
    { k: "Invoices", v: invoicesCount },
    { k: "Leads", v: leadsCount },
    { k: "Tickets", v: ticketsCount },
    { k: "Locale", v: typeof navigator !== "undefined" ? navigator.language : "—" },
    { k: "User agent", v: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 70) + "…" : "—" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {info.map((r) => (
        <div key={r.k} className="flex items-center justify-between rounded-lg border border-divider bg-background px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{color:"#999"}}>{r.k}</span>
          <span className="truncate text-[13px] font-bold">{String(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

/* -------- Theme -------- */
function ThemeSection() {
  const stored = useCRM((s) => s.moduleSettings["main.theme"]) ?? EMPTY_OBJ;
  const setSettings = useCRM((s) => s.setSettings);
  const [draft, setDraft] = useState<Record<string, any>>(() => ({
    primary: stored.primary ?? "#BF1833",
    density: stored.density ?? "comfortable",
    headJs: stored.headJs ?? "",
    bodyJs: stored.bodyJs ?? "",
  }));
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft({
      primary: stored.primary ?? "#BF1833",
      density: stored.density ?? "comfortable",
      headJs: stored.headJs ?? "",
      bodyJs: stored.bodyJs ?? "",
    });
  }, [stored]);
  const upd = (patch: any) => setDraft((d) => ({ ...d, ...patch }));
  const save = () => { setSettings("main.theme", draft); setSaved(true); setTimeout(() => setSaved(false), 1600); };
  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">Primary color</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={draft.primary} onChange={(e) => upd({ primary: e.target.value })}
            className="h-12 w-16 cursor-pointer rounded-lg border border-divider" />
          <Input value={draft.primary} onChange={(e) => upd({ primary: e.target.value })} className="max-w-[220px]" />
          <span className="text-[11px]" style={{color:"#999"}}>MetaEdge brand: #BF1833</span>
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Density</Label>
        <div className="inline-flex overflow-hidden rounded-lg border border-divider">
          {(["cozy","comfortable","compact"] as const).map((d) => (
            <button key={d} onClick={() => upd({ density: d })}
              className={cn("px-4 py-2 text-[12px] font-bold capitalize", draft.density === d ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Custom Head (JS / analytics)</Label>
        <textarea value={draft.headJs} onChange={(e) => upd({ headJs: e.target.value })}
          placeholder="<!-- Google Analytics, Meta Pixel, etc. -->"
          className="w-full min-h-[100px] rounded-lg border border-divider bg-background px-3 py-2 text-[13px] font-mono" />
      </div>
      <div>
        <Label className="mb-2 block">Custom Body (before &lt;/body&gt;)</Label>
        <textarea value={draft.bodyJs} onChange={(e) => upd({ bodyJs: e.target.value })}
          placeholder="<!-- Chat widget, tracking, etc. -->"
          className="w-full min-h-[100px] rounded-lg border border-divider bg-background px-3 py-2 text-[13px] font-mono" />
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
        <Button onClick={save} className="font-bold"><Save className="h-3.5 w-3.5" /> Save changes</Button>
      </div>
    </div>
  );
}

/* -------- Company Logo (Large + Small) -------- */
function CompanyLogoSection() {
  const stored = useCRM((s) => s.moduleSettings["main.logo"]) ?? EMPTY_OBJ;
  const setSettings = useCRM((s) => s.setSettings);
  const [draft, setDraft] = useState<{ large: string; small: string }>(() => ({
    large: stored.large ?? stored.dataUrl ?? "",
    small: stored.small ?? "",
  }));
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft({
      large: stored.large ?? stored.dataUrl ?? "",
      small: stored.small ?? "",
    });
  }, [stored]);
  const refL = useRef<HTMLInputElement>(null);
  const refS = useRef<HTMLInputElement>(null);
  const upload = (f: File, key: "large" | "small") => {
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, [key]: String(reader.result) }));
    reader.readAsDataURL(f);
  };
  const save = () => {
    setSettings("main.logo", { large: draft.large, small: draft.small, dataUrl: draft.large });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };
  const Slot = ({ label, hint, url, onPick, onClear, w, h }: { label: string; hint: string; url: string; onPick: () => void; onClear: () => void; w: number; h: number }) => (
    <div className="rounded-2xl border border-divider bg-background p-4">
      <div className="text-[12px] font-bold uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-divider bg-white" style={{ width: w, height: h }}>
          {url ? <img src={url} alt={label} className="h-full w-full object-contain" /> : <span className="text-[10px] font-bold uppercase" style={{color:"#999"}}>Empty</span>}
        </div>
        <div className="space-y-2">
          <Button variant="outline" onClick={onPick} className="font-bold"><Upload className="h-3.5 w-3.5" /> Upload</Button>
          {url && <Button variant="outline" onClick={onClear} className="font-bold"><Trash2 className="h-3.5 w-3.5" /> Remove</Button>}
        </div>
      </div>
      <p className="text-[11px] mt-2" style={{color:"#999"}}>{hint}</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Slot label="Large logo" hint="Ideal size 185×45 px. Used when sidebar is expanded and on invoices, estimates, etc." w={185} h={45}
          url={draft.large}
          onPick={() => refL.current?.click()}
          onClear={() => setDraft((d) => ({ ...d, large: "" }))} />
        <Slot label="Small logo (icon)" hint="Ideal size 45×45 px. Used when sidebar is collapsed." w={64} h={64}
          url={draft.small}
          onPick={() => refS.current?.click()}
          onClear={() => setDraft((d) => ({ ...d, small: "" }))} />
      </div>
      <input ref={refL} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "large"); e.target.value = ""; }} />
      <input ref={refS} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "small"); e.target.value = ""; }} />
      <p className="text-[11px]" style={{color:"#999"}}>PNG with transparent background is recommended. Click <b>Save changes</b> to apply.</p>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
        <Button onClick={save} className="font-bold"><Save className="h-3.5 w-3.5" /> Save changes</Button>
      </div>
    </div>
  );
}



function ModulesToggleSection() {
  const enabled = useCRM((s) => s.moduleSettings["main.modules"]) ?? EMPTY_OBJ;
  const set = useCRM((s) => s.setSetting);
  const list: { key: string; label: string }[] = [
    { key: "clients", label: "Clients" }, { key: "leads", label: "Leads" },
    { key: "projects", label: "Projects" }, { key: "tasks", label: "Tasks" },
    { key: "invoices", label: "Invoices" }, { key: "estimates", label: "Estimates" },
    { key: "proposals", label: "Proposals" }, { key: "contracts", label: "Contracts" },
    { key: "subscriptions", label: "Subscriptions" }, { key: "expenses", label: "Expenses" },
    { key: "tickets", label: "Tickets / Support" }, { key: "knowledgebase", label: "Knowledgebase" },
    { key: "timesheets", label: "Time Sheets" }, { key: "files", label: "Files" },
    { key: "emailMarketing", label: "Email Marketing" }, { key: "products", label: "Products" },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {list.map((m) => (
        <div key={m.key} className="flex items-center justify-between rounded-lg border border-divider bg-background px-4 py-3">
          <span className="text-sm font-bold">{m.label}</span>
          <Switch checked={enabled[m.key] ?? true} onCheckedChange={(v) => set("main.modules", m.key, v)} />
        </div>
      ))}
    </div>
  );
}

/* -------- Clear Cache -------- */
function ClearCacheSection() {
  const clearCache = useCRM((s) => s.clearCache);
  const [ok, setOk] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{color:"#666"}}>Flush the in-browser cache. This does not delete your CRM data.</p>
      <Button onClick={() => { clearCache(); setOk(true); setTimeout(()=>setOk(false),1500); }} className="font-bold">
        <RefreshCw className="h-3.5 w-3.5" /> Clear cache
      </Button>
      {ok && <div className="text-[12px] font-bold text-primary">Cache cleared.</div>}
    </div>
  );
}

/* -------- Error Logs -------- */
function ErrorLogsSection() {
  const logs = useCRM((s) => s.errorLogs);
  const clear = useCRM((s) => s.clearErrorLogs);
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button variant="outline" onClick={clear} className="font-bold" disabled={!logs.length}>Clear log</Button></div>
      {logs.length === 0 ? (
        <p className="text-[13px]" style={{color:"#666"}}>No errors logged.</p>
      ) : (
        <div className="rounded-xl border border-divider">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 border-b border-divider px-4 py-3 last:border-0">
              <AlertTriangle className={cn("mt-0.5 h-4 w-4", l.level === "error" ? "text-primary" : "text-[#F59E0B]")} />
              <div className="flex-1">
                <div className="text-[13px] font-bold">{l.message}</div>
                <div className="text-[11px]" style={{color:"#999"}}>{new Date(l.at).toLocaleString()} · {l.level.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Email API (existing feature preserved) -------- */
function EmailApiSection() {
  const cfg = useCRM((s) => s.emailConfig);
  const set = useCRM((s) => s.setEmailConfig);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Provider</Label>
          <Select value={cfg.provider} onValueChange={(v) => set({ provider: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Disabled (mailto fallback)</SelectItem>
              <SelectItem value="resend">Resend</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="mailgun">Mailgun</SelectItem>
              <SelectItem value="smtp">SMTP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>API key / secret</Label><Input type="password" value={cfg.apiKey ?? ""} onChange={(e) => set({ apiKey: e.target.value })} placeholder="Paste key" /></div>
        <div><Label>From name</Label><Input value={cfg.fromName} onChange={(e) => set({ fromName: e.target.value })} /></div>
        <div><Label>From email</Label><Input type="email" value={cfg.fromEmail} onChange={(e) => set({ fromEmail: e.target.value })} /></div>
        <div><Label>Verified domain</Label><Input value={cfg.domain ?? ""} onChange={(e) => set({ domain: e.target.value })} placeholder="mail.crm.metaedgecreatives.com" /></div>
      </div>
      <p className="text-[11px]" style={{color:"#999"}}>Keys are stored only in this browser. Without a provider, invoices and campaigns fall back to a native mailto link.</p>
    </div>
  );
}

/* -------- Integrations (existing feature preserved) -------- */
interface Integration { id: string; name: string; category: string; description: string; color: string; initial: string; }
const INTEGRATIONS: Integration[] = [
  { id: "resend", name: "Resend", category: "Email", description: "Send transactional emails via Resend.", color: "#000000", initial: "R" },
  { id: "gmail", name: "Gmail", category: "Email", description: "Sync email against contacts.", color: "#EA4335", initial: "G" },
  { id: "outlook", name: "Outlook", category: "Email", description: "Two-way sync with Microsoft 365.", color: "#0078D4", initial: "O" },
  { id: "slack", name: "Slack", category: "Chat", description: "Ping channels on pipeline changes.", color: "#4A154B", initial: "S" },
  { id: "gcal", name: "Google Calendar", category: "Calendar", description: "See meetings alongside your pipeline.", color: "#1A73E8", initial: "C" },
  { id: "stripe", name: "Stripe", category: "Payments", description: "Collect on invoices in one click.", color: "#635BFF", initial: "S" },
  { id: "quickbooks", name: "QuickBooks", category: "Accounting", description: "Push invoices into your ledger.", color: "#2CA01C", initial: "Q" },
  { id: "hubspot", name: "HubSpot", category: "Migration", description: "One-click import from HubSpot.", color: "#FF7A59", initial: "H" },
  { id: "mailchimp", name: "Mailchimp", category: "Marketing", description: "Sync segments into campaigns.", color: "#FFE01B", initial: "M" },
  { id: "zapier", name: "Zapier", category: "Automation", description: "Trigger 5,000+ apps on any event.", color: "#FF4A00", initial: "Z" },
  { id: "notion", name: "Notion", category: "Docs", description: "Embed briefs and project docs.", color: "#000000", initial: "N" },
  { id: "linkedin", name: "LinkedIn", category: "Prospecting", description: "Enrich contacts with LinkedIn.", color: "#0A66C2", initial: "in" },
  { id: "drive", name: "Google Drive", category: "Storage", description: "Attach Drive files to any record.", color: "#0F9D58", initial: "D" },
];
function IntegrationsSection() {
  const connected = useCRM((s) => s.moduleSettings["integrations.connected"]) ?? EMPTY_OBJ;
  const set = useCRM((s) => s.setSetting);
  const [q, setQ] = useState("");
  const filtered = INTEGRATIONS.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Search integrations…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <div className="ml-auto text-[11px]" style={{color:"#999"}}>
          {Object.values(connected).filter(Boolean).length} of {INTEGRATIONS.length} connected
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i) => {
          const isOn = !!connected[i.id];
          return (
            <div key={i.id} className="rounded-xl border border-divider bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: i.color }}>{i.initial}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-black">{i.name}</div>
                    {isOn && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{color:"#999"}}>{i.category}</div>
                </div>
              </div>
              <p className="mt-3 text-[12px]" style={{color:"#666"}}>{i.description}</p>
              <Button variant={isOn ? "outline" : "default"} size="sm" className="mt-3 w-full font-bold"
                onClick={() => set("integrations.connected", i.id, !isOn)}>
                {isOn ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Data / Backup -------- */
function DataSection() {
  const state = useCRM();
  const replaceAll = useCRM((s) => s.replaceAll);
  const reset = useCRM((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `metaedge-crm-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const upload = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.users || !Array.isArray(parsed.users)) throw new Error("Invalid file");
      replaceAll(parsed);
      setMsg("Data restored.");
    } catch (err) { setMsg(err instanceof Error ? err.message : "Could not read file."); }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{color:"#666"}}>Everything lives in this browser. Back up regularly.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={download} className="font-bold"><Download className="h-3.5 w-3.5" /> Download backup</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="font-bold"><Upload className="h-3.5 w-3.5" /> Restore</Button>
        <Button variant="outline" onClick={() => { if (confirm("Reset ALL data? This cannot be undone.")) reset(); }} className="font-bold"><Trash2 className="h-3.5 w-3.5" /> Reset</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
      {msg && <p className="text-[12px] font-bold text-primary">{msg}</p>}
    </div>
  );
}

/* -------- My Profile (current user) -------- */
function MyProfileSection() {
  const currentUser = useCurrentUser();
  const updateUser = useCRM((s) => s.updateUser);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    jobTitle: currentUser?.jobTitle ?? "",
  });
  const [pw, setPw] = useState({ code: "", next: "", confirm: "" });
  const [codeSent, setCodeSent] = useState<{ code: string; at: number } | null>(null);
  const requestPasswordReset = useCRM((s) => s.requestPasswordReset);
  const resetPassword = useCRM((s) => s.resetPassword);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!currentUser) {
    return <p className="text-[13px]" style={{ color: "#666" }}>You need to be signed in to edit your profile.</p>;
  }

  const saveProfile = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setMsg({ kind: "err", text: "Name and email are required." });
      return;
    }
    updateUser(currentUser.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
    });
    setMsg({ kind: "ok", text: "Profile saved." });
    setTimeout(() => setMsg(null), 2000);
  };

  const sendCode = () => {
    const res = requestPasswordReset(currentUser.email);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error ?? "Could not send code." });
      return;
    }
    setCodeSent({ code: res.code!, at: Date.now() });
    setMsg({ kind: "ok", text: `Verification code sent to ${currentUser.email}.` });
    setTimeout(() => setMsg(null), 4000);
  };

  const changePassword = () => {
    if (!codeSent) {
      setMsg({ kind: "err", text: "Send a verification code to your email first." });
      return;
    }
    if (!pw.code.trim()) {
      setMsg({ kind: "err", text: "Enter the verification code sent to your email." });
      return;
    }
    if (!pw.next || pw.next.length < 6) {
      setMsg({ kind: "err", text: "New password must be at least 6 characters." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setMsg({ kind: "err", text: "Passwords do not match." });
      return;
    }
    const res = resetPassword(currentUser.email, pw.code.trim(), pw.next);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error ?? "Could not update password." });
      return;
    }
    setPw({ code: "", next: "", confirm: "" });
    setCodeSent(null);
    setMsg({ kind: "ok", text: "Password updated." });
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-sm font-black text-primary">
            {initials(currentUser.name)}
          </span>
          <div>
            <div className="text-sm font-black">{currentUser.name}</div>
            <div className="text-[11px]" style={{ color: "#999" }}>
              {currentUser.isSuperAdmin ? "Super Admin" : (currentUser.jobTitle || "Team member")}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label>Full name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Job title</Label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          {msg && (
            <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-bold", msg.kind === "ok" ? "text-primary" : "text-red-600")}>
              {msg.kind === "ok" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {msg.text}
            </span>
          )}
          <Button onClick={saveProfile} className="font-bold"><Save className="h-3.5 w-3.5" /> Save changes</Button>
        </div>
      </div>

      <div className="border-t border-divider pt-6">
        <div className="mb-1 text-[13px] font-black uppercase tracking-wider" style={{ color: "#666" }}>Change password</div>
        <p className="mb-3 text-[12px]" style={{ color: "#888" }}>
          For your security, we'll email a 6-digit verification code to <span className="font-bold">{currentUser.email}</span>. Enter it below along with your new password.
        </p>
        <div className="mb-3 flex items-center gap-3">
          <Button type="button" variant="outline" onClick={sendCode} className="font-bold">
            <ShieldCheck className="h-3.5 w-3.5" /> {codeSent ? "Resend code" : "Send verification code"}
          </Button>
          {codeSent && (
            <span className="text-[12px]" style={{ color: "#666" }}>
              Code sent. (Demo code: <span className="font-mono font-bold">{codeSent.code}</span> — in production this arrives by email only.)
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div><Label>Verification code</Label><Input value={pw.code} onChange={(e) => setPw({ ...pw, code: e.target.value })} placeholder="6-digit code" disabled={!codeSent} /></div>
          <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} disabled={!codeSent} /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} disabled={!codeSent} /></div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={changePassword} disabled={!codeSent} className="font-bold"><ShieldCheck className="h-3.5 w-3.5" /> Update password</Button>
        </div>
      </div>
    </div>
  );
}
