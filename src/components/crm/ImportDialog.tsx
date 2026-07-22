import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { parseCsv, downloadCsvTemplate } from "@/lib/crm/csv";

export type ImportField = { key: string; label: string; required?: boolean };

export function ImportDialog<T extends Record<string, string>>({
  entityLabel,
  fields,
  sample = [],
  onImport,
  triggerLabel = "Import CSV",
}: {
  entityLabel: string; // "clients", "projects"
  fields: ImportField[];
  sample?: T[];
  onImport: (rows: T[]) => number | Promise<number>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<T[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [imported, setImported] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setRows([]); setFileName(""); setError(""); setImported(null); };
  const requiredKeys = fields.filter((f) => f.required).map((f) => f.key);
  const headerKeys = fields.map((f) => f.key);

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    try {
      const text = await file.text();
      let parsed: T[];
      if (file.name.toLowerCase().endsWith(".json")) {
        const j = JSON.parse(text);
        parsed = (Array.isArray(j) ? j : [j]) as T[];
      } else {
        parsed = parseCsv(text) as T[];
      }
      if (!parsed.length) { setError("File is empty."); return; }
      const missing = requiredKeys.filter((k) => !(k in parsed[0]));
      if (missing.length) { setError(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`); return; }
      setRows(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse file.");
    }
  };

  const runImport = async () => {
    const valid = rows.filter((r) => requiredKeys.every((k) => (r[k] ?? "").toString().trim() !== ""));
    const n = await onImport(valid);
    setImported(n);
  };

  const preview = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-bold">
          <Upload className="h-3.5 w-3.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import {entityLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file. Download the template to see the exact column headers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={() => downloadCsvTemplate(`${entityLabel}-template`, headerKeys, sample)}
            >
              <Download className="h-3.5 w-3.5" /> Download CSV template
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            <Button
              type="button"
              size="sm"
              className="font-semibold"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Choose file
            </Button>
            {fileName && <span className="text-xs text-neutral-500">{fileName}</span>}
          </div>

          <div className="rounded-md border bg-neutral-50 p-3 text-xs">
            <div className="font-bold mb-1">Expected columns</div>
            <div className="flex flex-wrap gap-1">
              {fields.map((f) => (
                <span key={f.key} className="rounded bg-white border px-2 py-0.5">
                  {f.label}{f.required ? " *" : ""}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" /> {error}
            </div>
          )}

          {rows.length > 0 && !error && imported === null && (
            <div className="rounded-md border overflow-hidden">
              <div className="bg-neutral-50 px-3 py-1.5 text-xs font-bold">
                Preview — {rows.length} row{rows.length === 1 ? "" : "s"} detected
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-100">
                    <tr>{headerKeys.map((k) => <th key={k} className="px-2 py-1 text-left font-semibold">{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t">
                        {headerKeys.map((k) => (
                          <td key={k} className="px-2 py-1 text-neutral-700 truncate max-w-[160px]">{r[k] ?? ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > preview.length && (
                <div className="bg-neutral-50 px-3 py-1 text-[11px] text-neutral-500">
                  + {rows.length - preview.length} more…
                </div>
              )}
            </div>
          )}

          {imported !== null && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Imported {imported} {entityLabel}.
            </div>
          )}
        </div>

        <DialogFooter>
          {imported === null ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={runImport} disabled={!rows.length || !!error} className="font-bold">
                Import {rows.length || ""} row{rows.length === 1 ? "" : "s"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="font-bold">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
