import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Button onClick={onClick} className="font-bold">
      <Plus className="h-4 w-4" strokeWidth={3} />
      {children}
    </Button>
  );
}