import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Save, KeyRound, Mail, Upload, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/portal/settings")({
  head: () => ({ meta: [{ title: "Settings · Client Portal" }] }),
  component: PortalSettings,
});

function PortalSettings() {
  const client = useCurrentClientUser();
  const updateCurrentClientUser = useCRM((s) => s.updateCurrentClientUser);

  const [profile, setProfile] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    companyName: client?.companyName ?? "",
    jobTitle: client?.jobTitle ?? "",
    address: client?.address ?? "",
    avatarUrl: client?.avatarUrl ?? "",
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    companyName: client?.companyName ?? "",
    jobTitle: client?.jobTitle ?? "",
    address: client?.address ?? "",
    avatarUrl: client?.avatarUrl ?? "",
  }), [profile, client]);

  const save = () => {
    updateCurrentClientUser(profile);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  };

  const onAvatar = (file: File) => {
    const r = new FileReader();
    r.onload = () => setProfile((p) => ({ ...p, avatarUrl: String(r.result) }));
    r.readAsDataURL(file);
  };

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">Settings</div>
          <div className="text-xs" style={{ color: "#777" }}>Manage your profile and account security.</div>
        </div>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-divider bg-white p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-black">Profile</div>
            <div className="text-[11px]" style={{ color: "#888" }}>How MetaEdge sees you.</div>
          </div>
          <Button onClick={save} disabled={!dirty} className="font-bold">
            {savedAt ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save changes</>}
          </Button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-accent text-2xl font-black text-primary">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold hover:bg-muted">
              <Upload className="h-3.5 w-3.5" /> Upload photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onAvatar(f); }} />
            </label>
            {profile.avatarUrl && (
              <button onClick={() => setProfile({ ...profile, avatarUrl: "" })} className="text-[11px] font-bold text-primary hover:underline">Remove photo</button>
            )}
          </div>
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
            <div><Label>Full name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div><Label>Company</Label><Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} /></div>
            <div><Label>Job title</Label><Input value={profile.jobTitle} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Address</Label><Textarea rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
          </div>
        </div>
      </section>

      {/* Password */}
      <PasswordSection email={client.email} />
    </div>
  );
}

function PasswordSection({ email }: { email: string }) {
  const requestClientPasswordReset = useCRM((s) => s.requestClientPasswordReset);
  const resetClientPassword = useCRM((s) => s.resetClientPassword);
  const [sent, setSent] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const sendCode = () => {
    setMsg(null);
    const res = requestClientPasswordReset(email);
    if (!res.ok) return setMsg({ ok: false, text: res.error || "Could not send code." });
    setSent(true);
    setDemoCode(res.code || null);
  };

  const submit = () => {
    setMsg(null);
    if (pw.length < 6) return setMsg({ ok: false, text: "Password must be at least 6 characters." });
    if (pw !== confirm) return setMsg({ ok: false, text: "Passwords don't match." });
    const res = resetClientPassword(email, code, pw);
    if (!res.ok) return setMsg({ ok: false, text: res.error || "Could not update password." });
    setMsg({ ok: true, text: "Password updated." });
    setSent(false); setDemoCode(null); setCode(""); setPw(""); setConfirm("");
  };

  return (
    <section className="rounded-2xl border border-divider bg-white p-5 md:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm font-black"><KeyRound className="h-4 w-4 text-primary" /> Change password</div>
        <div className="text-[11px]" style={{ color: "#888" }}>We'll email a 6-digit verification code to <b>{email}</b> before making changes.</div>
      </div>

      {!sent ? (
        <Button onClick={sendCode}><Mail className="h-4 w-4" /> Send verification code</Button>
      ) : (
        <div className="space-y-3">
          {demoCode && (
            <div className="rounded-lg border border-primary/25 bg-accent px-3 py-2 text-center text-xs">
              Demo code: <span className="ml-1 font-black tracking-[0.3em] text-primary">{demoCode}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><Label>Verification code</Label><Input maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <div><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div><Label>Confirm password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={submit}>Update password</Button>
            <Button variant="outline" onClick={() => { setSent(false); setDemoCode(null); setCode(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {msg && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${msg.ok ? "border border-green-200 bg-green-50 text-green-700" : "border border-primary/25 bg-accent text-primary"}`}>
          {msg.text}
        </div>
      )}
    </section>
  );
}
