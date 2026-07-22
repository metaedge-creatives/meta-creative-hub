import { Link, Outlet, useRouterState, useNavigate, Navigate } from "@tanstack/react-router";
import { type ComponentType, useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Settings as SettingsIcon,
  LogOut,
  UsersRound,
  Flame,
  BadgeDollarSign,
  Mail,
  FileText,
  ScrollText,
  LifeBuoy,
  BarChart3,
  Receipt,
  Search,
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Flag,
  Calculator,
  Package,
  Repeat,
  Wallet,
  Percent,
  Tag,
  Ticket,
  Shield,
  FolderOpen,
  BookOpen,
  Menu,
  X,
  CreditCard,
  Undo2,
  Zap,

  History,
  Inbox,
} from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentUser, initials } from "@/lib/crm/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/crm/Logo";
import { GlobalSearch } from "@/components/crm/GlobalSearch";
import type { AppNotification } from "@/lib/crm/types";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  match: (p: string) => boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
      { to: "/reports", label: "Reports", icon: BarChart3, match: (p) => p.startsWith("/reports") },
    ],
  },
  {
    label: "Customers",
    items: [
      { to: "/contacts", label: "Clients", icon: Users, match: (p) => p.startsWith("/contacts") || p.startsWith("/companies") },
      { to: "/customers/client-users", label: "Client Users", icon: UsersRound, match: (p) => p.startsWith("/customers") },
      { to: "/leads", label: "Leads", icon: Flame, match: (p) => p.startsWith("/leads") },
      { to: "/deals", label: "Sales Pipeline", icon: BadgeDollarSign, match: (p) => p.startsWith("/deals") || p.startsWith("/sales") },
    ],
  },
  {
    label: "Delivery",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban, match: (p) => p.startsWith("/projects") },
      { to: "/tasks", label: "Tasks", icon: CheckSquare, match: (p) => p.startsWith("/tasks") },
      { to: "/milestones", label: "Milestones", icon: Flag, match: (p) => p.startsWith("/milestones") },
      { to: "/time-sheets", label: "Time Sheets", icon: Clock, match: (p) => p.startsWith("/time-sheets") },
      { to: "/files", label: "Files", icon: FolderOpen, match: (p) => p.startsWith("/files") },
    ],
  },
  {
    label: "Sales Pipeline",
    items: [
      { to: "/deals", label: "Sales Pipeline", icon: BadgeDollarSign, match: (p) => p.startsWith("/deals") || p.startsWith("/sales") },
      { to: "/invoices", label: "Invoices", icon: Receipt, match: (p) => p.startsWith("/invoices") },
      { to: "/payments", label: "Payments", icon: CreditCard, match: (p) => p.startsWith("/payments") },
      { to: "/refunds", label: "Refunds", icon: Undo2, match: (p) => p.startsWith("/refunds") },
      { to: "/estimates", label: "Estimates", icon: Calculator, match: (p) => p.startsWith("/estimates") },
      { to: "/subscriptions", label: "Subscriptions", icon: Repeat, match: (p) => p.startsWith("/subscriptions") },
      { to: "/products", label: "Products", icon: Package, match: (p) => p.startsWith("/products") },
      { to: "/expenses", label: "Expenses", icon: Wallet, match: (p) => p.startsWith("/expenses") },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/email-marketing", label: "Email Marketing", icon: Mail, match: (p) => p.startsWith("/email-marketing") },
      { to: "/proposals", label: "Proposals", icon: FileText, match: (p) => p.startsWith("/proposals") },
      { to: "/contracts", label: "Contracts", icon: ScrollText, match: (p) => p.startsWith("/contracts") },
      { to: "/support", label: "Support", icon: LifeBuoy, match: (p) => p.startsWith("/support") },
      { to: "/tickets", label: "Tickets", icon: Ticket, match: (p) => p.startsWith("/tickets") },
    ],
  },
  {
    label: "Organization",
    items: [
      { to: "/modules", label: "Modules", icon: Shield, match: (p) => p.startsWith("/modules") },
      { to: "/automations", label: "Automations", icon: Zap, match: (p) => p.startsWith("/automations") },
      { to: "/tax", label: "Tax", icon: Percent, match: (p) => p.startsWith("/tax") },
      { to: "/tags", label: "Tags", icon: Tag, match: (p) => p.startsWith("/tags") },
      
      { to: "/export-history", label: "Export History", icon: History, match: (p) => p.startsWith("/export-history") },
      { to: "/knowledgebase", label: "Knowledgebase", icon: BookOpen, match: (p) => p.startsWith("/knowledgebase") },
    ],
  },
];

const NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useCurrentUser();
  if (!user) return null;

  return (
    <aside className="side-rail flex h-screen w-64 shrink-0 flex-col px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] ring-1 ring-black/5 shrink-0">
          <Logo size={30} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[13px] font-black tracking-tight" style={{ color: "#2A1418" }}>MetaEdge</div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">Creatives · CRM</div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(191,24,51,0.25)_transparent]">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            <div className="mb-1 mt-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-primary/60">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = item.match(path);
              return (
                <Link key={item.to} to={item.to} data-active={active} className="rail-btn group" onClick={onNavigate}>
                  <span className="rail-icon">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-2 border-t border-black/5 pt-3">
        <Link to="/settings" data-active={path.startsWith("/settings")} className="rail-btn group" onClick={onNavigate}>
          <span className="rail-icon">
            <SettingsIcon className="h-[18px] w-[18px]" />
          </span>
          <span className="truncate">Settings</span>
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/50 p-2 ring-1 ring-black/5">
          <div className="rounded-full bg-gradient-to-br from-[#E23A56] to-[#8E0F24] p-[2px] shrink-0">
            <Avatar className="h-9 w-9 border-2 border-white">
              <AvatarFallback className="bg-white text-primary text-[10px] font-black">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12px] font-black" style={{ color: "#2A1418" }}>{user.name}</div>
            <div className="truncate text-[9px] font-bold uppercase tracking-widest text-primary">
              {user.isSuperAdmin ? "Super Admin" : user.jobTitle || "Member"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {

  const user = useCurrentUser();
  const logout = useCRM((s) => s.logout);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isDash = path === "/";


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 md:px-8 md:pt-8 md:pb-4">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="glass-chip mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            MetaEdge Creatives
          </div>
          {isDash && (
            <div className="mt-1 hidden text-sm sm:block" style={{ color: "#7A6870" }}>
              Welcome back, <span className="font-semibold text-primary">{user?.name?.split(" ")[0]}</span> — here's what's moving today.
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <GlobalSearch />
        <NotificationsBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="glass-chip flex items-center gap-2 rounded-2xl px-2 py-1.5 sm:pr-3 transition hover:-translate-y-0.5">
            <div className="rounded-full bg-gradient-to-br from-[#E23A56] to-[#8E0F24] p-[2px]">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-white text-primary text-[11px] font-black">
                  {initials(user?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="hidden pr-1 text-left leading-tight sm:block">
              <div className="text-xs font-black" style={{ color: "#2A1418" }}>{user?.name}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#B08A93" }}>
                {user?.isSuperAdmin ? "Super Admin" : user?.jobTitle || "Member"}
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-xs font-bold">{user?.name}</div>
              <div className="text-[10px] font-normal" style={{ color: "#999" }}>{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useCurrentUser();

  // Cross-tab realtime sync: when any other tab updates the store,
  // rehydrate this tab so UI stays live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === "metaedge-crm-v6") {
        // @ts-ignore — zustand persist API
        useCRM.persist?.rehydrate?.();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Public routes (login + client portal own their auth): render Outlet directly.
  if (path === "/login" || path === "/portal" || path.startsWith("/portal/")) {
    return <Outlet />;
  }

  // Everything else requires a session.
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Settings is a full-screen standalone page (no sidebar / topbar).
  if (path.startsWith("/settings")) {
    return <Outlet />;
  }

  return (
    <AppLayout />
  );
}

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  return (
    <div className="app-mesh flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="sticky top-0 z-40 hidden h-screen lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <TopBar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-4 pb-8 pt-2 sm:px-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


export function NoAccess({ module }: { module: string }) {
  return (
    <div className="widget-card p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary font-black">
        !
      </div>
      <h2 className="text-xl font-extrabold">No access to {module}</h2>
      <p className="mt-2 text-sm" style={{ color: "#666" }}>
        Ask a super admin to grant you {module} access in Settings.
      </p>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function NotificationsBell() {
  const navigate = useNavigate();
  const notifications = useCRM((s) => s.notifications);
  const markRead = useCRM((s) => s.markNotificationRead);
  const markAll = useCRM((s) => s.markAllNotificationsRead);
  const clearAll = useCRM((s) => s.clearNotifications);
  const deleteOne = useCRM((s) => s.deleteNotification);
  const unread = notifications.filter((n) => !n.read).length;

  const handleOpen = (n: AppNotification) => {
    markRead(n.id);
    if (n.link) navigate({ to: n.link });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="glass-chip relative flex h-12 w-12 items-center justify-center rounded-2xl transition hover:-translate-y-0.5"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-primary" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white ring-2 ring-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-[380px] rounded-3xl border border-white/70 bg-white/95 p-0 shadow-[0_20px_60px_-20px_rgba(191,24,51,0.35)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Live</div>
            <div className="text-sm font-black" style={{ color: "#2A1418" }}>
              Notifications {unread > 0 && <span className="text-primary">· {unread}</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-primary transition hover:bg-white disabled:opacity-40"
              title="Mark all read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={clearAll}
              disabled={notifications.length === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-primary transition hover:bg-white disabled:opacity-40"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-black" style={{ color: "#2A1418" }}>You're all caught up</div>
              <div className="mt-1 text-xs" style={{ color: "#7A6870" }}>
                Activity across your CRM will show up here in real time.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {notifications.map((n) => (
                <li key={n.id} className="group relative">
                  <button
                    onClick={() => handleOpen(n)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-primary/5"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent ring-1 ring-black/15" : "bg-primary shadow-[0_0_8px_rgba(191,24,51,0.6)]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-black" style={{ color: "#2A1418" }}>{n.title}</div>
                      {n.body && (
                        <div className="truncate text-[12px]" style={{ color: "#7A6870" }}>{n.body}</div>
                      )}
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary/80">
                        {timeAgo(n.at)}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-primary opacity-0 transition group-hover:opacity-100 hover:bg-primary/10"
                    aria-label="Dismiss"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}