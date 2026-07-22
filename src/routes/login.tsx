import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentUser } from "@/lib/crm/hooks";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/crm/Logo";
import { ArrowRight, Eye, EyeOff, Shield, Sparkles, Zap, KeyRound, Mail, Users, Briefcase, ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · MetaEdge Creatives CRM" },
      { name: "description", content: "Sign in to MetaEdge Creatives CRM." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const login = useCRM((s) => s.login);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [role, setRole] = useState<null | "client" | "team">(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "enter" | "exit-to-portal">("idle");
  const [mirror, setMirror] = useState(false); // when true: form on LEFT, brand on RIGHT

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("mec.swap") === "to-login") {
      sessionStorage.removeItem("mec.swap");
      setRole("team");
      setMirror(true);
      setPhase("enter");
      const t = setTimeout(() => setPhase("idle"), 560);
      return () => clearTimeout(t);
    }
  }, []);

  const goClient = () => {
    if (phase === "exit-to-portal") return;
    sessionStorage.setItem("mec.swap", "to-portal");
    setPhase("exit-to-portal");
    setTimeout(() => navigate({ to: "/portal" }), 400);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.ok) navigate({ to: "/" });
      else setError(result.error ?? "Sign in failed");
    }, 220);
  };

  // Animation classes:
  // Brand panel starts on LEFT (default) or RIGHT (mirror).
  //  - exit-to-portal: brand always slides OUT toward its OWN side (left→left, right→right)
  //  - enter (arrived from portal, mirror=true, brand on RIGHT): comes IN from RIGHT
  const brandAnim =
    phase === "exit-to-portal"
      ? mirror ? "swap-out-right" : "swap-out-left"
      : phase === "enter"
        ? "swap-in-right"
        : "";
  const formAnim =
    phase === "exit-to-portal"
      ? mirror ? "swap-out-left" : "swap-out-right"
      : phase === "enter"
        ? "swap-in-left"
        : "";



  return (
    <div className={`relative flex min-h-screen overflow-hidden bg-background ${mirror ? "lg:flex-row-reverse" : ""}`}>
      {/* LEFT — brand stage */}
      <div className={`relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex side-dark ${brandAnim}`}>
        <div className="grid-mesh absolute inset-0 opacity-70" />
        <div
          className="aurora-blob"
          style={{ background: "radial-gradient(circle,#FF6B85,transparent 60%)", width: 520, height: 520, top: -120, left: -120, opacity: 0.5 }}
        />
        <div
          className="aurora-blob"
          style={{ background: "radial-gradient(circle,#3A0710,transparent 60%)", width: 460, height: 460, bottom: -140, right: -100, animationDelay: "-6s", opacity: 0.7 }}
        />
        <div
          className="aurora-blob"
          style={{ background: "radial-gradient(circle,#FFC9D2,transparent 65%)", width: 300, height: 300, top: "40%", left: "35%", opacity: 0.2, animationDelay: "-3s" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight text-white">
            <div className="text-sm font-extrabold tracking-tight">MetaEdge Creatives</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              Internal Operations Portal
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md text-white">
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-white">
            Where creative <br />
            momentum <span className="italic text-white/80">gets shipped</span>.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            One canvas for every client, deal, project and deliverable at MetaEdge Creatives. Fast, private, and made for your team.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, k: "Real-time", v: "Instant updates" },
              { icon: Shield, k: "Private", v: "Local by default" },
              { icon: Sparkles, k: "Crafted", v: "Made in-house" },
            ].map((c) => (
              <div
                key={c.k}
                className="group relative overflow-hidden rounded-xl border border-white/70 p-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.85) 55%, rgba(255,255,255,0.95) 100%)",
                  backdropFilter: "blur(18px) saturate(160%)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl opacity-90"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)",
                  }}
                />
                <c.icon className="relative mb-2 h-4 w-4 text-primary" />
                <div className="relative text-[11px] font-extrabold text-neutral-900">{c.k}</div>
                <div className="relative text-[10px] font-semibold text-neutral-600">{c.v}</div>
              </div>
            ))}

          </div>

        </div>

        <div className="relative z-10 text-[11px] text-white/50">
          © {new Date().getFullYear()} MetaEdge Creatives · metaedgecreatives.com
        </div>
      </div>

      {/* RIGHT — role picker + form */}
      <div className={`relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2 ${formAnim}`}>
        <div
          className="aurora-blob lg:hidden"
          style={{ background: "radial-gradient(circle,#FDF5F7,transparent 65%)", width: 420, height: 420, top: -140, right: -60 }}
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={44} />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">MetaEdge Creatives</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Internal Portal
              </div>
            </div>
          </div>

          {role === null && (
            <div key="picker" className="animate-fade-in">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3 w-3" /> Choose how you sign in
                </div>
                <h2 className="mt-4 text-4xl font-black tracking-tight">Who are you?</h2>
                <p className="mt-2 text-sm" style={{ color: "#666" }}>
                  Pick an option below to continue to the right workspace.
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={goClient}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-divider bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_rgba(255,60,90,0.35)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-transform group-hover:scale-110">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black tracking-tight">Client</div>
                    <div className="text-[12px]" style={{ color: "#666" }}>
                      Track your projects, approvals & deliverables.
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setRole("team")}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-divider bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_rgba(255,60,90,0.35)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-transform group-hover:scale-110">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black tracking-tight">Team Member</div>
                    <div className="text-[12px]" style={{ color: "#666" }}>
                      Sign in to your MetaEdge internal workspace.
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="mt-8 text-center text-[11px]" style={{ color: "#999" }}>
                Protected workspace · MetaEdge Creatives
              </div>
            </div>
          )}

          {role === "team" && (
            <div key="form" className="animate-fade-in">
              <button
                type="button"
                onClick={() => { setRole(null); setError(null); }}
                className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Secure team sign in
                </div>
                <h2 className="mt-4 text-4xl font-black tracking-tight">Welcome back.</h2>
                <p className="mt-2 text-sm" style={{ color: "#666" }}>
                  Enter your credentials to continue to your workspace.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4 animate-scale-in">
                <div className="field">
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Work email</label>
                </div>

                <div className="field">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="group relative h-12 w-full overflow-hidden font-extrabold text-sm tracking-wide"
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {loading ? "Signing in…" : "Sign in to workspace"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Button>

                <div className="flex items-center justify-between pt-1 text-[11px]" style={{ color: "#999" }}>
                  <span>Protected workspace · MetaEdge Creatives</span>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center text-[11px]" style={{ color: "#999" }}>
                Not a team member?{" "}
                <button
                  type="button"
                  onClick={goClient}
                  className="font-bold text-primary hover:underline"
                >
                  Client sign in →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}

function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const requestPasswordReset = useCRM((s) => s.requestPasswordReset);
  const resetPassword = useCRM((s) => s.resetPassword);
  const emailConfig = useCRM((s) => s.emailConfig);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1); setEmail(""); setCode(""); setDisplayCode(null);
      setNewPassword(""); setConfirm(""); setError(null); setMsg(null);
    }
  }, [open]);

  const sendCode = () => {
    setError(null);
    const res = requestPasswordReset(email);
    if (!res.ok) { setError(res.error ?? "Could not send code."); return; }
    if (emailConfig.provider !== "none" && emailConfig.apiKey) {
      setMsg(`A 6-digit code has been sent to ${email} via ${emailConfig.provider.toUpperCase()}.`);
      setDisplayCode(null);
    } else {
      setMsg("Email sender not configured. Your one-time code is shown below (configure Email API in Settings for real delivery).");
      setDisplayCode(res.code ?? null);
    }
    setStep(2);
  };

  const submitReset = () => {
    setError(null);
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords don't match."); return; }
    const res = resetPassword(email, code, newPassword);
    if (!res.ok) { setError(res.error ?? "Reset failed."); return; }
    setStep(3);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Reset password
          </DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "#666" }}>
              Enter your work email and we'll send a 6-digit verification code.
            </p>
            <div>
              <Label>Work email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@metaedgecreatives.com" />
            </div>
            {error && <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{error}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={sendCode} className="font-bold"><Mail className="h-4 w-4" /> Send code</Button>
            </DialogFooter>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            {msg && <p className="rounded-lg bg-accent p-2 text-[11px] font-semibold text-primary">{msg}</p>}
            {displayCode && (
              <div className="rounded-lg border border-primary/25 bg-white p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#999" }}>Your one-time code</div>
                <div className="mt-1 text-2xl font-black tracking-[0.3em] text-primary">{displayCode}</div>
              </div>
            )}
            <div>
              <Label>Verification code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-xs font-semibold text-primary">{error}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={submitReset} className="font-bold">Reset password</Button>
            </DialogFooter>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl">✓</div>
            <div className="text-lg font-black">Password updated</div>
            <p className="text-xs" style={{ color: "#666" }}>You can now sign in with your new password.</p>
            <Button onClick={onClose} className="w-full font-bold">Back to sign in</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}