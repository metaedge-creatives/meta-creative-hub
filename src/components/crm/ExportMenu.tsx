import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react";
import { exportData, type ExportFormat } from "@/lib/crm/export";
import { useCRM } from "@/lib/crm/store";

type Col = { key: string; label?: string };

export function ExportMenu({
  label = "Export",
  filenameBase,
  entity,
  title,
  rows,
  columns,
  disabled,
}: {
  label?: string;
  filenameBase: string;
  entity?: string;
  title?: string;
  rows: any[];
  columns?: Col[];
  disabled?: boolean;
}) {
  const logExport = useCRM((s) => s.logExport);
  const handle = (fmt: ExportFormat) => {
    if (!rows || rows.length === 0) {
      alert("Nothing to export.");
      return;
    }
    const ext = fmt === "pdf" ? "pdf" : fmt === "json" ? "json" : "csv";
    const filename = `${filenameBase}.${ext}`;
    exportData(fmt, filenameBase, rows, { title: title ?? filenameBase, columns });
    logExport({ entity: entity ?? filenameBase, format: fmt, filename, rowCount: rows.length });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="font-bold">
          <Download className="h-3.5 w-3.5" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider">
          Export as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handle("csv")}>
          <FileSpreadsheet className="h-4 w-4" /> CSV file
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle("pdf")}>
          <FileText className="h-4 w-4" /> PDF document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle("json")}>
          <FileJson className="h-4 w-4" /> JSON (raw)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
