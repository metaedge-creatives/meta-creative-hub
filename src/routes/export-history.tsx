import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Trash2, FileSpreadsheet, FileText, FileJson } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/export-history")({
  head: () => ({
    meta: [
      { title: "Export History · MetaEdge CRM" },
      { name: "description", content: "Audit trail of every CSV, PDF and JSON export from your CRM." },
    ],
  }),
  component: ExportHistoryPage,
});

function fmtIcon(f: string) {
  if (f === "csv") return <FileSpreadsheet className="h-3.5 w-3.5" />;
  if (f === "pdf") return <FileText className="h-3.5 w-3.5" />;
  return <FileJson className="h-3.5 w-3.5" />;
}

function ExportHistoryPage() {
  const history = useCRM((s) => s.exportHistory);
  const clear = useCRM((s) => s.clearExportHistory);
  const [q, setQ] = useState("");
  const [fmt, setFmt] = useState<string>("all");
  const [entity, setEntity] = useState<string>("all");

  const entities = useMemo(
    () => Array.from(new Set(history.map((h) => h.entity))).sort(),
    [history],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return history.filter((h) => {
      if (fmt !== "all" && h.format !== fmt) return false;
      if (entity !== "all" && h.entity !== entity) return false;
      if (!needle) return true;
      return (
        h.userName.toLowerCase().includes(needle) ||
        h.entity.toLowerCase().includes(needle) ||
        h.filename.toLowerCase().includes(needle)
      );
    });
  }, [history, q, fmt, entity]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Export History</h1>
            <p className="text-sm text-neutral-500">
              Audit trail of who exported what and when.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={history.length === 0}
          onClick={() => {
            if (confirm("Clear all export history?")) clear();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search user, entity or filename…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={fmt} onValueChange={setFmt}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-neutral-500">
          {rows.length} of {history.length} record{history.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-[11px] font-black uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Filename</th>
              <th className="px-4 py-3 text-right">Rows</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                  No exports recorded yet. Any CSV, PDF or JSON export will appear here.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                    {new Date(r.at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.userName}</td>
                  <td className="px-4 py-3">{r.entity}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="gap-1 uppercase">
                      {fmtIcon(r.format)} {r.format}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{r.filename}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.rowCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
