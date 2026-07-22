import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Plus, Search, Trash2, Edit3, FolderPlus } from "lucide-react";
import { useCRM } from "@/lib/crm/store";
import { PageHeader } from "@/components/crm/PageHeader";
import { NewButton } from "@/components/crm/NewButton";
import { EmptyState } from "@/components/crm/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ListItem } from "@/lib/crm/types"
const EMPTY_LIST: any[] = [];;

export const Route = createFileRoute("/knowledgebase")({
  head: () => ({ meta: [{ title: "Knowledge Base · MetaEdge CRM" }] }),
  component: KBPage,
});

type AMeta = { categoryId?: string; body?: string; visibleToClient?: boolean };

function KBPage() {
  const cats = useCRM((s) => s.lists["kb_categories"] ?? EMPTY_LIST);
  const arts = useCRM((s) => s.lists["kb_articles"] ?? EMPTY_LIST);
  const add = useCRM((s) => s.addListItem);
  const update = useCRM((s) => s.updateListItem);
  const del = useCRM((s) => s.deleteListItem);
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState<string>("all");
  const [edit, setEdit] = useState<ListItem | null>(null);
  const [view, setView] = useState<ListItem | null>(null);
  const [manageCats, setManageCats] = useState(false);

  const filtered = useMemo(() => arts.filter((a) => {
    const m = (a.meta ?? {}) as AMeta;
    const s = q.toLowerCase();
    if (s && !a.name.toLowerCase().includes(s) && !(m.body ?? "").toLowerCase().includes(s)) return false;
    if (catF !== "all" && (m.categoryId ?? "") !== catF) return false;
    return true;
  }), [arts, q, catF]);

  const create = () => {
    const it = add("kb_articles", { name: "Untitled article", meta: { body: "", categoryId: cats[0]?.id } as AMeta });
    setEdit(it);
  };

  return (
    <div>
      <PageHeader title="Knowledge Base" subtitle={`${arts.length} articles · ${cats.length} categories`}
        actions={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setManageCats(true)}><FolderPlus className="mr-1 h-4 w-4" />Categories</Button>
          <NewButton onClick={create}>New Article</NewButton>
        </div>} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#999" }} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search knowledge base…" className="pl-9" />
        </div>
        <Select value={catF} onValueChange={setCatF}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All categories</SelectItem>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <aside className="rounded-md border border-divider bg-card p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#666" }}>Categories</div>
          <button onClick={() => setCatF("all")} className={`block w-full text-left rounded px-2 py-1 text-sm ${catF === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>
            All <span className="text-xs opacity-70">({arts.length})</span>
          </button>
          {cats.map((c) => {
            const count = arts.filter((a) => (a.meta as AMeta)?.categoryId === c.id).length;
            return (
              <button key={c.id} onClick={() => setCatF(c.id)} className={`block w-full text-left rounded px-2 py-1 text-sm ${catF === c.id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>
                {c.name} <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
          {cats.length === 0 && <div className="text-xs" style={{ color: "#999" }}>No categories yet.</div>}
        </aside>

        <div className="md:col-span-3">
          {filtered.length === 0 ? (
            <EmptyState title="No articles found" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((a) => {
                const m = (a.meta ?? {}) as AMeta;
                const cat = cats.find((c) => c.id === m.categoryId);
                return (
                  <article key={a.id} className="rounded-md border border-divider bg-card p-4 brand-shadow">
                    <button onClick={() => setView(a)} className="text-left w-full">
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#BF1833" }}>{cat?.name ?? "Uncategorized"}</div>
                      <div className="mt-1 text-base font-bold">{a.name}</div>
                      <p className="mt-2 text-sm line-clamp-3" style={{ color: "#666" }}>{(m.body ?? "").slice(0, 160) || "No content yet."}</p>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEdit(a)}><Edit3 className="mr-1 h-3 w-3" />Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete article?")) del("kb_articles", a.id); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {edit && <ArticleEditor item={edit} cats={cats} onClose={() => setEdit(null)} onSave={(p) => update("kb_articles", edit.id, p)} />}
      {view && <ArticleViewer item={view} cats={cats} onClose={() => setView(null)} onEdit={() => { setEdit(view); setView(null); }} />}
      {manageCats && <CategoriesDialog onClose={() => setManageCats(false)} />}
    </div>
  );
}

function ArticleEditor({ item, cats, onClose, onSave }: { item: ListItem; cats: ListItem[]; onClose: () => void; onSave: (p: Partial<ListItem>) => void }) {
  const [name, setName] = useState(item.name);
  const [m, setM] = useState<AMeta>((item.meta ?? {}) as AMeta);
  const save = () => { onSave({ name, meta: m }); onClose(); };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Article</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Category</Label>
            <Select value={m.categoryId ?? ""} onValueChange={(v) => setM({ ...m, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Content</Label>
            <textarea rows={14} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={m.body ?? ""} onChange={(e) => setM({ ...m, body: e.target.value })} /></div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={!!m.visibleToClient} onChange={(e) => setM({ ...m, visibleToClient: e.target.checked })} className="h-4 w-4 accent-[--maroon]" />
            Visible to clients
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} className="font-bold">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArticleViewer({ item, cats, onClose, onEdit }: { item: ListItem; cats: ListItem[]; onClose: () => void; onEdit: () => void }) {
  const m = (item.meta ?? {}) as AMeta;
  const cat = cats.find((c) => c.id === m.categoryId);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#BF1833" }}>{cat?.name ?? "Uncategorized"}</div>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.body ?? ""}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onEdit}><Edit3 className="mr-1 h-4 w-4" />Edit</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesDialog({ onClose }: { onClose: () => void }) {
  const items = useCRM((s) => s.lists["kb_categories"] ?? EMPTY_LIST);
  const add = useCRM((s) => s.addListItem);
  const del = useCRM((s) => s.deleteListItem);
  const [name, setName] = useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Knowledge Base Categories</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Onboarding, FAQ" />
          <Button onClick={() => { if (name.trim()) { add("kb_categories", { name: name.trim() }); setName(""); } }}><Plus className="h-4 w-4" /></Button>
        </div>
        <ul className="mt-2 space-y-1">
          {items.length === 0 && <li className="text-sm" style={{ color: "#999" }}>No categories yet.</li>}
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-divider bg-card px-3 py-2 text-sm">
              <span>{c.name}</span>
              <Button size="sm" variant="ghost" onClick={() => del("kb_categories", c.id)}><Trash2 className="h-3 w-3" /></Button>
            </li>
          ))}
        </ul>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
