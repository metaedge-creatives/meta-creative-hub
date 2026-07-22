import jsPDF from "jspdf";

export type ExportFormat = "csv" | "json" | "pdf";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function flatten(v: any): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(flatten).join("; ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

type Col = { key: string; label?: string };
function toCSV(rows: any[], columns?: Col[]): string {
  if (rows.length === 0) return "";
  const cols =
    columns ??
    Array.from(
      rows.reduce<Set<string>>((set, r) => {
        Object.keys(r ?? {}).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    ).map((key): Col => ({ key }));
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = cols.map((c) => esc(c.label ?? c.key)).join(",");
  const body = rows
    .map((r) => cols.map((c) => esc(flatten(r?.[c.key]))).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function toPDF(
  title: string,
  rows: any[],
  columns?: { key: string; label?: string }[],
): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(196, 30, 58);
  doc.text(title, margin, margin + 6);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Exported ${new Date().toLocaleString()} · ${rows.length} record${rows.length === 1 ? "" : "s"}`,
    margin,
    margin + 22,
  );

  const cols =
    columns ??
    Array.from(
      rows.reduce<Set<string>>((set, r) => {
        Object.keys(r ?? {}).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    )
      .slice(0, 8)
      .map((key) => ({ key }));

  const colW = (pageW - margin * 2) / Math.max(cols.length, 1);
  let y = margin + 46;
  const rowH = 20;

  doc.setFillColor(196, 30, 58);
  doc.rect(margin, y - 14, pageW - margin * 2, rowH, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  cols.forEach((c, i) => {
    doc.text(String(c.label ?? c.key).toUpperCase(), margin + 6 + i * colW, y);
  });
  y += rowH - 4;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);
  rows.forEach((r, idx) => {
    if (y > pageH - margin) {
      doc.addPage();
      y = margin + 20;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 245, 246);
      doc.rect(margin, y - 12, pageW - margin * 2, rowH, "F");
    }
    cols.forEach((c, i) => {
      const val = flatten(r?.[c.key]);
      const maxChars = Math.max(8, Math.floor(colW / 5));
      const clipped =
        val.length > maxChars ? val.slice(0, maxChars - 1) + "…" : val;
      doc.text(clipped, margin + 6 + i * colW, y);
    });
    y += rowH;
  });

  return doc.output("blob");
}

export function exportData(
  format: ExportFormat,
  filenameBase: string,
  rows: any[],
  options?: { title?: string; columns?: { key: string; label?: string }[] },
) {
  const date = new Date().toISOString().slice(0, 10);
  const base = `${filenameBase}-${date}`;
  if (format === "json") {
    download(
      new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
      `${base}.json`,
    );
  } else if (format === "csv") {
    download(new Blob([toCSV(rows, options?.columns)], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
  } else {
    download(toPDF(options?.title ?? filenameBase, rows, options?.columns), `${base}.pdf`);
  }
}
