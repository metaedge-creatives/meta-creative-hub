import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Video, Clock, Sparkles } from "lucide-react";

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

function Chip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
