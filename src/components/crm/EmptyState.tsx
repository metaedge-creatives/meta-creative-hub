import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-divider bg-card p-12 text-center">
      <h3 className="text-base font-extrabold">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#666" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}