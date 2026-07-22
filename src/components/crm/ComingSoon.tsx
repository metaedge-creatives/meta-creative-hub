import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  subtitle,
  features,
  icon,
}: {
  title: string;
  subtitle: string;
  features: { title: string; body: string }[];
  icon?: ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="relative overflow-hidden rounded-2xl border border-divider bg-card brand-shadow">
        <div className="h-1 bg-primary" />
        <div className="relative p-10">
          <div
            className="aurora-blob"
            style={{ background: "radial-gradient(circle,#BF1833,transparent 60%)", width: 380, height: 380, top: -140, right: -80 }}
          />
          <div
            className="aurora-blob"
            style={{ background: "radial-gradient(circle,#FDF5F7,transparent 60%)", width: 320, height: 320, bottom: -160, left: -60, animationDelay: "-6s" }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3 w-3" /> In active build
            </div>
            <h3 className="mt-4 max-w-2xl text-3xl font-black tracking-tight">
              {icon}
              A dedicated <span className="text-primary">{title}</span> workspace is landing shortly.
            </h3>
            <p className="mt-3 max-w-xl text-sm" style={{ color: "#666" }}>
              We're shaping this module around how MetaEdge actually works. Preview what's coming below.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="group relative overflow-hidden rounded-xl border border-divider bg-background p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[13px] font-black text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-sm font-extrabold">{f.title}</div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "#666" }}>
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}