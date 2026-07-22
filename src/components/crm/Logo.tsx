import logoAsset from "@/assets/metaedge-logo.jpg.asset.json";
import { cn } from "@/lib/utils";
import { useCRM } from "@/lib/crm/store";

export function Logo({
  size = 40,
  className,
  showWordmark = false,
  wordmarkClass,
  variant = "small",
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClass?: string;
  variant?: "small" | "large";
}) {
  const uploaded = useCRM((s) => {
    const l = s.moduleSettings["main.logo"];
    if (!l) return "";
    if (variant === "large") return l.large || l.dataUrl || l.small || "";
    return l.small || l.dataUrl || l.large || "";
  });
  const src = uploaded || logoAsset.url;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt="MetaEdge Creatives"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
      {showWordmark && (
        <div className={cn("leading-tight", wordmarkClass)}>
          <div className="text-[13px] font-extrabold tracking-tight">MetaEdge</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            Creatives
          </div>
        </div>
      )}
    </div>
  );
}
