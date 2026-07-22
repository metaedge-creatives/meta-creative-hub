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

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

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


  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* LEFT — brand stage */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex side-dark">
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
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">
            <Sparkles className="h-3 w-3" /> Studio OS · v3
          </div>
          <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-white">
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
              <div key={c.k} className="glass rounded-xl p-3">
                <c.icon className="mb-2 h-4 w-4 text-white" />
                <div className="text-[11px] font-extrabold text-white">{c.k}</div>
                <div className="text-[10px] text-white/70">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-white/50">
          © {new Date().getFullYear()} MetaEdge Creatives · metaedgecreatives.com
        </div>
      </div>

      {/* RIGHT — sign in form */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
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

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Secure sign in
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-tight">Welcome back.</h2>
            <p className="mt-2 text-sm" style={{ color: "#666" }}>
              Enter your credentials to continue to your workspace.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
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
            <div className="mt-4 rounded-lg border border-divider bg-accent/40 px-3 py-2 text-center text-[11px]" style={{ color: "#666" }}>
              Not a team member?{" "}
              <a href="/portal" className="font-bold text-primary hover:underline">
                Go to the client portal →
              </a>
            </div>
          </form>
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