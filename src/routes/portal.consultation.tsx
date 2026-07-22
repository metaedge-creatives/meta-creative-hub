import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Video, Clock, Sparkles, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentClientUser } from "@/lib/crm/hooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ConsultationStatus } from "@/lib/crm/types";

const CALENDLY_URL = "https://calendly.com/metaedgecreatives-info/30min";

export const Route = createFileRoute("/portal/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Free Consultation · Client Portal" },
      { name: "description", content: "Book a free 30-minute consultation with the MetaEdge Creatives team." },
    ],
  }),
  component: PortalConsultation,
});

function PortalConsultation() {
  const client = useCurrentClientUser();
  const allBookings = useCRM((s) => s.consultationBookings) ?? [];
  const addConsultationBooking = useCRM((s) => s.addConsultationBooking);

  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const myBookings = useMemo(
    () => (client ? allBookings.filter((b) => b.clientUserId === client.id) : []),
    [allBookings, client],
  );

  if (!client) {
    return (
      <div className="rounded-2xl border border-divider bg-white p-8 text-center text-sm text-neutral-500">
        Please sign in to book a consultation.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please add a topic for your consultation.");
      return;
    }
    setBusy(true);
    try {
      addConsultationBooking({
        clientUserId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        topic: topic.trim(),
        preferredDate: preferredDate || undefined,
        notes: notes.trim() || undefined,
        calendlyUrl: CALENDLY_URL,
      });
      setTopic("");
      setPreferredDate("");
      setNotes("");
      toast.success("Consultation request sent to the team.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-divider bg-gradient-to-br from-primary to-[#8A0F24] p-6 text-white md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Free consultation
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            Book a free 30-minute call
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Pick a time that suits you — we'll discuss your goals, scope and the fastest path to launch.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Chip icon={Clock} label="30 minutes" />
            <Chip icon={Video} label="Google Meet / Zoom" />
            <Chip icon={CalendarClock} label="Instant confirmation" />
          </div>
        </div>
      </div>

      {/* Quick request form (scoped to current client) */}
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-divider bg-white p-5 md:p-6">
        <div>
          <div className="text-lg font-black tracking-tight">Request a consultation</div>
          <div className="text-xs text-neutral-500">
            This request is linked to your account — only you and the MetaEdge team can see it.
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Website revamp" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">Preferred date</label>
            <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">Notes</label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Share any context that will help us prepare." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            Signed in as <span className="font-bold text-neutral-800">{client.name}</span> · {client.email}
          </div>
          <Button type="submit" disabled={busy} className="bg-primary text-white hover:bg-primary/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send request
          </Button>
        </div>
      </form>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <div className="rounded-2xl border border-divider bg-white p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-black tracking-tight">Your consultation requests</div>
            <div className="text-xs text-neutral-500">{myBookings.length} total</div>
          </div>
          <div className="divide-y divide-divider">
            {myBookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900">{b.topic || "Consultation"}</div>
                  <div className="text-xs text-neutral-500">
                    {b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : "No preferred date"} · requested{" "}
                    {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <StatusPill status={b.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendly embed */}
      <div className="overflow-hidden rounded-2xl border border-divider bg-white">
        <iframe
          src={CALENDLY_URL}
          title="Book a consultation with MetaEdge Creatives"
          className="h-[780px] w-full"
          frameBorder={0}
        />
      </div>

      <div className="text-center text-xs" style={{ color: "#888" }}>
        Trouble seeing the calendar?{" "}
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-primary hover:underline"
        >
          Open Calendly in a new tab →
        </a>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ConsultationStatus }) {
  const map: Record<ConsultationStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    requested: { label: "Requested", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    completed: { label: "Completed", className: "bg-neutral-100 text-neutral-700 border-neutral-200", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  };
  const { label, className, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function Chip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
