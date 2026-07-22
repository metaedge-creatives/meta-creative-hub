import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Logo } from "@/components/crm/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, FileText, ScrollText, CreditCard, PieChart, LifeBuoy, Settings, CalendarClock,
  LogOut, Menu, X, ArrowRight, Sparkles, ShieldCheck, Eye, EyeOff, KeyRound, Mail, CheckCircle2,
  FolderKanban, BarChart3, Layers, MessagesSquare,
} from "lucide-react";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Client Portal · MetaEdge Creatives" },
      { name: "description", content: "Sign in to your client portal — projects, invoices, reports and services in one place." },
    ],
  }),
  component: PortalLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  key: string;
  exact?: boolean;
}
interface NavSection { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { to: "/portal", label: "Dashboard", icon: LayoutDashboard, key: "dashboard", exact: true },
      { to: "/portal/reports", label: "Reports", icon: BarChart3, key: "reports" },
    ],
  },
  {
    label: "My Work",
    items: [
      { to: "/portal/projects", label: "Projects", icon: FolderKanban, key: "projects" },
      { to: "/portal/services", label: "Services", icon: Layers, key: "services" },
      { to: "/portal/requests", label: "My Requests", icon: MessagesSquare, key: "requests" },
      { to: "/portal/proposals", label: "Proposals", icon: FileText, key: "proposals" },
      { to: "/portal/contracts", label: "Contracts", icon: ScrollText, key: "contracts" },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/portal/invoices", label: "Invoices", icon: FileText, key: "invoices" },
      { to: "/portal/payments", label: "Payments", icon: CreditCard, key: "payments" },
      { to: "/portal/spending", label: "Spending", icon: PieChart, key: "spending" },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/portal/consultation", label: "Book a call", icon: CalendarClock, key: "consultation" },
      { to: "/portal/support", label: "Support", icon: LifeBuoy, key: "support" },
      { to: "/portal/settings", label: "Settings", icon: Settings, key: "settings" },
    ],
  },
];

function PortalLayout() {
  const client = useCurrentClientUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!client) return <PortalAuthScreen />;

  const perms = client.permissions ?? {};
  const filteredSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((it) => (perms as any)[it.key] !== false),
  })).filter((sec) => sec.items.length > 0);

  return (
    <div className="app-mesh flex min-h-screen">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-sm font-black">Client Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-xl p-2 text-primary hover:bg-accent"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="sticky top-0 z-40 hidden h-screen lg:block">
        <PortalSidebar sections={filteredSections} />
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
            <PortalSidebar sections={filteredSections} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function PortalSidebar({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const client = useCurrentClientUser();
  const clientLogout = useCRM((s) => s.clientLogout);
  const navigate = useNavigate();
  const loc = useLocation();

  if (!client) return null;

  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname === to || loc.pathname.startsWith(to + "/");

  const doLogout = () => {
    clientLogout();
    navigate({ to: "/portal" });
  };

  return (
    <aside className="side-rail flex h-screen w-64 shrink-0 flex-col px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_10px_24px_-10px_rgba(191,24,51,0.5)] ring-1 ring-black/5 shrink-0">
          <Logo size={30} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[13px] font-black tracking-tight" style={{ color: "#2A1418" }}>MetaEdge</div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">Creatives · Portal</div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(191,24,51,0.25)_transparent]">
        {sections.map((section) => (
          <div key={section.label} className="mb-2">
            <div className="mb-1 mt-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-primary/60">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-active={active}
                  className="rail-btn group"
                  onClick={onNavigate}
                >
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
        <div className="mt-1 flex items-center gap-3 rounded-2xl bg-secondary/50 p-2 ring-1 ring-black/5">
          <div className="rounded-full bg-gradient-to-br from-[#E23A56] to-[#8E0F24] p-[2px] shrink-0">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-[10px] font-black text-primary">
              {client.avatarUrl ? (
                <img src={client.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                client.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
              )}
            </span>
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12px] font-black" style={{ color: "#2A1418" }}>{client.name}</div>
            <div className="truncate text-[9px] font-bold uppercase tracking-widest text-primary">Client</div>
          </div>
          <button
            onClick={doLogout}
            className="rounded-lg p-1.5 text-primary/70 hover:bg-white hover:text-primary"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ==================== AUTH SCREEN (sign in / sign up) ==================== */

function PortalAuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [phase, setPhase] = useState<"idle" | "enter" | "exit">("idle");
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("mec.swap") === "to-portal") {
      sessionStorage.removeItem("mec.swap");
      setPhase("enter");
      const t = setTimeout(() => setPhase("idle"), 560);
      return () => clearTimeout(t);
    }
  }, []);

  const goStaff = (e: React.MouseEvent) => {
    e.preventDefault();
    if (phase === "exit") return;
    sessionStorage.setItem("mec.swap", "to-login");
    setPhase("exit");
    setTimeout(() => navigate({ to: "/login" }), 400);
  };

  const brandAnim = phase === "exit" ? "swap-out-right" : phase === "enter" ? "swap-in-right" : "";
  const formAnim = phase === "exit" ? "swap-out-left" : phase === "enter" ? "swap-in-left" : "";

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className={`relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex side-dark ${brandAnim}`}>
        <div className="grid-mesh absolute inset-0 opacity-60" />
        <div className="aurora-blob" style={{ background: "radial-gradient(circle,#FF6B85,transparent 60%)", width: 520, height: 520, top: -120, left: -120, opacity: 0.5 }} />
        <div className="aurora-blob" style={{ background: "radial-gradient(circle,#3A0710,transparent 60%)", width: 460, height: 460, bottom: -140, right: -100, animationDelay: "-6s", opacity: 0.7 }} />

        <div className="relative z-10 flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight text-white">
            <div className="text-sm font-extrabold tracking-tight">MetaEdge Creatives</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Client Portal</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-white">
            Everything you need,<br /><span className="italic text-white/80">in one place.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Track projects, get reports, book services, sign contracts and pay invoices — 24/7, from any device.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: FolderKanban, k: "Projects", v: "Live progress" },
              { icon: BarChart3, k: "Reports", v: "Weekly & monthly" },
              { icon: MessagesSquare, k: "Services", v: "Request & book" },
            ].map((c) => (
              <div
                key={c.k}
                className="relative overflow-hidden rounded-xl p-3 border border-white/60 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]"
                style={{
                  background: "linear-gradient(140deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.95) 100%)",
                  backdropFilter: "blur(14px) saturate(160%)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)" }}
                />
                <c.icon className="relative mb-2 h-4 w-4 text-primary" />
                <div className="relative text-[11px] font-extrabold text-neutral-900">{c.k}</div>
                <div className="relative text-[10px] text-neutral-600">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-white/50">
          © {new Date().getFullYear()} MetaEdge Creatives · metaedgecreatives.com
        </div>
      </div>

      <div className={`relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2 ${formAnim}`}>
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={44} />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">MetaEdge Creatives</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Client Portal</div>
            </div>
          </div>

          {mode === "signin" && <SignInForm switchTo={setMode} />}
          {mode === "signup" && <SignUpForm switchTo={setMode} />}
          {mode === "forgot" && <ForgotForm switchTo={setMode} />}

          <div className="mt-8 text-center text-[11px]" style={{ color: "#999" }}>
            Team member?{" "}
            <a href="/login" onClick={goStaff} className="font-bold text-primary hover:underline">
              Staff sign in →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ switchTo }: { switchTo: (m: "signin" | "signup" | "forgot") => void }) {
  const clientLogin = useCRM((s) => s.clientLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    setTimeout(() => {
      const res = clientLogin(email, password);
      setLoading(false);
      if (!res.ok) setErr(res.error ?? "Sign in failed");
    }, 180);
  };

  return (
    <>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="h-3 w-3" /> Client sign in
        </div>
        <h2 className="mt-4 text-4xl font-black tracking-tight">Welcome back.</h2>
        <p className="mt-2 text-sm" style={{ color: "#666" }}>Sign in to your MetaEdge client portal.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {err && (
          <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{err}</div>
        )}

        <Button type="submit" disabled={loading} className="h-12 w-full font-extrabold">
          {loading ? "Signing in…" : (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
        </Button>

        <div className="flex items-center justify-between pt-1 text-[11px]" style={{ color: "#999" }}>
          <button type="button" onClick={() => switchTo("forgot")} className="font-semibold text-primary hover:underline">
            Forgot password?
          </button>
          <button type="button" onClick={() => switchTo("signup")} className="font-semibold text-primary hover:underline">
            New here? Create account →
          </button>
        </div>
      </form>
    </>
  );
}

function SignUpForm({ switchTo }: { switchTo: (m: "signin" | "signup" | "forgot") => void }) {
  const clientSignup = useCRM((s) => s.clientSignup);
  const [f, setF] = useState({ name: "", email: "", companyName: "", phone: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    const p = f.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [f.password]);
  const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"][strength];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.name.trim()) return setErr("Enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setErr("Enter a valid email.");
    if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
    if (f.password !== f.confirm) return setErr("Passwords don't match.");
    setLoading(true);
    setTimeout(() => {
      const res = clientSignup({
        name: f.name,
        email: f.email,
        password: f.password,
        companyName: f.companyName || undefined,
        phone: f.phone || undefined,
      });
      setLoading(false);
      if (!res.ok) setErr(res.error ?? "Could not create account.");
    }, 200);
  };

  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3 w-3" /> Create your account
        </div>
        <h2 className="mt-4 text-4xl font-black tracking-tight">Join the portal.</h2>
        <p className="mt-2 text-sm" style={{ color: "#666" }}>Set up your client account — instant access, no waiting.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><Label>Full name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Jane Doe" required /></div>
          <div><Label>Email *</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@company.com" required /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><Label>Company</Label><Input value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} placeholder="Optional" /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Optional" /></div>
        </div>
        <div>
          <Label>Password *</Label>
          <div className="relative">
            <Input type={showPw ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Toggle password">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {f.password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 flex-1 rounded" style={{ background: i < strength ? "var(--primary, #BF1833)" : "#eee" }} />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#888" }}>{strengthLabel}</span>
            </div>
          )}
        </div>
        <div><Label>Confirm password *</Label><Input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required /></div>

        {err && (
          <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{err}</div>
        )}

        <Button type="submit" disabled={loading} className="h-12 w-full font-extrabold">
          {loading ? "Creating your account…" : (<>Create account <ArrowRight className="h-4 w-4" /></>)}
        </Button>

        <p className="text-center text-[11px]" style={{ color: "#999" }}>By continuing you agree to our terms and privacy policy.</p>

        <div className="pt-1 text-center text-[11px]" style={{ color: "#999" }}>
          Already have an account?{" "}
          <button type="button" onClick={() => switchTo("signin")} className="font-semibold text-primary hover:underline">Sign in →</button>
        </div>
      </form>
    </>
  );
}

function ForgotForm({ switchTo }: { switchTo: (m: "signin" | "signup" | "forgot") => void }) {
  const requestClientPasswordReset = useCRM((s) => s.requestClientPasswordReset);
  const resetClientPassword = useCRM((s) => s.resetClientPassword);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const send = () => {
    setErr(null);
    const res = requestClientPasswordReset(email);
    if (!res.ok) return setErr(res.error ?? "Could not send code.");
    setDisplayCode(res.code ?? null);
    setStep(2);
  };
  const submit = () => {
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords don't match.");
    const res = resetClientPassword(email, code, password);
    if (!res.ok) return setErr(res.error ?? "Could not reset password.");
    setStep(3);
  };

  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
          <KeyRound className="h-3 w-3" /> Reset password
        </div>
        <h2 className="mt-4 text-4xl font-black tracking-tight">Forgot password?</h2>
        <p className="mt-2 text-sm" style={{ color: "#666" }}>We'll email a one-time 6-digit code.</p>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
          {err && <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{err}</div>}
          <Button onClick={send} className="h-12 w-full font-extrabold"><Mail className="h-4 w-4" /> Send verification code</Button>
          <button type="button" onClick={() => switchTo("signin")} className="w-full text-[11px] font-semibold text-primary hover:underline">Back to sign in</button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          {displayCode && (
            <div className="rounded-lg border border-primary/25 bg-white p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#999" }}>Demo one-time code</div>
              <div className="mt-1 text-2xl font-black tracking-[0.3em] text-primary">{displayCode}</div>
              <div className="mt-1 text-[10px]" style={{ color: "#999" }}>Configure Email API in Settings for real delivery.</div>
            </div>
          )}
          <div><Label>Verification code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} /></div>
          <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          {err && <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{err}</div>}
          <Button onClick={submit} className="h-12 w-full font-extrabold">Reset password</Button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-[11px] font-semibold text-primary hover:underline">Back</button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div className="text-lg font-black">Password updated</div>
          <p className="text-xs" style={{ color: "#666" }}>Sign in with your new password.</p>
          <Button onClick={() => switchTo("signin")} className="w-full font-bold">Back to sign in</Button>
        </div>
      )}
    </>
  );
}
