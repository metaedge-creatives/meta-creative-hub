import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCan, useCurrentUser, formatDate } from "@/lib/crm/hooks";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState } from "@/components/crm/EmptyState";
import { NoAccess } from "@/components/crm/AppShell";
import { NewButton } from "@/components/crm/NewButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Square, Plus, Trash2, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, ChecklistItem, TaskComment, TimeEntry } from "@/lib/crm/types";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks · MetaEdge Creatives CRM" },
      { name: "description", content: "Follow-ups and to-dos across the CRM." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const can = useCan("tasks");
  const user = useCurrentUser();
  const tasks = useCRM((s) => s.tasks);
  const users = useCRM((s) => s.users);
  const toggleTask = useCRM((s) => s.toggleTask);
  const deleteTask = useCRM((s) => s.deleteTask);
  const [detail, setDetail] = useState<Task | null>(null);
  if (!can) return <NoAccess module="Tasks" />;

  const now = new Date().toISOString().slice(0, 10);
  const mine = tasks.filter((t) => t.assigneeId === user?.id || t.assignedUserIds?.includes(user?.id ?? ""));
  const overdue = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < now);

  const renderList = (list: typeof tasks) =>
    list.length === 0 ? (
      <EmptyState title="Nothing to do here" />
    ) : (
      <ul className="space-y-2">
        {list.map((t) => {
          const assignee = users.find((u) => u.id === t.assigneeId);
          const running = t.timeEntries?.some((e) => !e.endedAt);
          return (
            <li key={t.id} className="flex items-center gap-3 rounded-md border border-divider bg-card px-4 py-3 brand-shadow">
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="h-4 w-4 accent-[--maroon]" onClick={(e) => e.stopPropagation()} />
              <button onClick={() => setDetail(t)} className="flex-1 text-left">
                <div className={`text-sm font-semibold ${t.done ? "line-through" : ""}`} style={t.done ? { color: "#999" } : undefined}>
                  {t.title}
                  {t.priority && t.priority !== "normal" && <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${t.priority === "urgent" ? "bg-red-100 text-red-700" : t.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>{t.priority}</span>}
                  {running && <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-bold uppercase">Running</span>}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#999" }}>
                  {formatDate(t.dueDate)}{assignee ? ` · ${assignee.name}` : ""}
                </div>
              </button>
              <button
                onClick={() => { if (confirm("Delete task?")) deleteTask(t.id); }}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${tasks.filter((t) => !t.done).length} open`} actions={<NewTaskDialog />} />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All <span className="ml-2 text-[10px] font-bold" style={{ color: "#999" }}>{tasks.length}</span></TabsTrigger>
          <TabsTrigger value="mine">Mine <span className="ml-2 text-[10px] font-bold" style={{ color: "#999" }}>{mine.length}</span></TabsTrigger>
          <TabsTrigger value="overdue">Overdue <span className="ml-2 text-[10px] font-bold" style={{ color: "#999" }}>{overdue.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderList(tasks)}</TabsContent>
        <TabsContent value="mine" className="mt-4">{renderList(mine)}</TabsContent>
        <TabsContent value="overdue" className="mt-4">{renderList(overdue)}</TabsContent>
      </Tabs>
      {detail && <TaskDetailDialog task={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function TaskDetailDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const user = useCurrentUser();
  const users = useCRM((s) => s.users);
  const live = useCRM((s) => s.tasks.find((t) => t.id === task.id)) ?? task;
  const updateTask = useCRM((s) => s.updateTask);
  const [checkTitle, setCheckTitle] = useState("");
  const [comment, setComment] = useState("");
  const [, setTick] = useState(0);

  const running = live.timeEntries?.find((e) => !e.endedAt);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running?.id]);

  const addCheck = () => {
    if (!checkTitle.trim()) return;
    const item: ChecklistItem = { id: uid(), title: checkTitle.trim(), done: false };
    updateTask(task.id, { checklist: [...(live.checklist ?? []), item] });
    setCheckTitle("");
  };
  const toggleCheck = (id: string) => updateTask(task.id, { checklist: (live.checklist ?? []).map((c) => c.id === id ? { ...c, done: !c.done } : c) });
  const removeCheck = (id: string) => updateTask(task.id, { checklist: (live.checklist ?? []).filter((c) => c.id !== id) });

  const addComment = () => {
    if (!comment.trim()) return;
    const c: TaskComment = { id: uid(), authorId: user?.id ?? "user", body: comment.trim(), at: new Date().toISOString() };
    updateTask(task.id, { comments: [...(live.comments ?? []), c] });
    setComment("");
  };

  const startTimer = () => {
    if (running) return;
    const e: TimeEntry = { id: uid(), userId: user?.id ?? "user", startedAt: new Date().toISOString(), seconds: 0 };
    updateTask(task.id, { timeEntries: [...(live.timeEntries ?? []), e] });
  };
  const stopTimer = () => {
    if (!running) return;
    const seconds = Math.floor((Date.now() - new Date(running.startedAt).getTime()) / 1000);
    updateTask(task.id, {
      timeEntries: (live.timeEntries ?? []).map((e) => e.id === running.id ? { ...e, endedAt: new Date().toISOString(), seconds } : e),
    });
  };

  const totalSeconds = (live.timeEntries ?? []).reduce((s, e) => s + (e.endedAt ? e.seconds : Math.floor((Date.now() - new Date(e.startedAt).getTime()) / 1000)), 0);
  const hms = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;

  const doneCount = (live.checklist ?? []).filter((c) => c.done).length;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{live.title}</DialogTitle></DialogHeader>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: "#666" }}>
          {live.status && <span className="rounded-full bg-muted px-2 py-0.5 font-bold uppercase">{live.status.replace("_", " ")}</span>}
          {live.priority && <span className={`rounded-full px-2 py-0.5 font-bold uppercase ${live.priority === "urgent" ? "bg-red-100 text-red-700" : live.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>{live.priority}</span>}
          {live.dueDate && <span>Due {formatDate(live.dueDate)}</span>}
          {live.billable && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-bold uppercase">Billable</span>}
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="checklist">Checklist ({doneCount}/{(live.checklist ?? []).length})</TabsTrigger>
            <TabsTrigger value="comments">Comments ({(live.comments ?? []).length})</TabsTrigger>
            <TabsTrigger value="timer">Timer</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-3">
            <div><Label>Description</Label>
              <textarea rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={live.description ?? ""} onChange={(e) => updateTask(task.id, { description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={live.status ?? "new"} onValueChange={(v) => updateTask(task.id, { status: v as Task["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["new", "in_progress", "awaiting_feedback", "completed"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label>Priority</Label>
                <Select value={live.priority ?? "normal"} onValueChange={(v) => updateTask(task.id, { priority: v as Task["priority"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "normal", "high", "urgent"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label>Due date</Label>
                <Input type="date" value={live.dueDate ?? ""} onChange={(e) => updateTask(task.id, { dueDate: e.target.value })} /></div>
              <div><Label>Assignee</Label>
                <Select value={live.assigneeId ?? ""} onValueChange={(v) => updateTask(task.id, { assigneeId: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Input value={checkTitle} onChange={(e) => setCheckTitle(e.target.value)} placeholder="Add checklist item…" onKeyDown={(e) => e.key === "Enter" && addCheck()} />
              <Button onClick={addCheck}><Plus className="h-4 w-4" /></Button>
            </div>
            <ul className="space-y-1">
              {(live.checklist ?? []).length === 0 && <li className="text-sm" style={{ color: "#999" }}>No checklist items.</li>}
              {(live.checklist ?? []).map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-md border border-divider bg-card px-3 py-2">
                  <input type="checkbox" checked={c.done} onChange={() => toggleCheck(c.id)} className="h-4 w-4 accent-[--maroon]" />
                  <span className={`flex-1 text-sm ${c.done ? "line-through" : ""}`} style={c.done ? { color: "#999" } : undefined}>{c.title}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeCheck(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 space-y-3">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {(live.comments ?? []).length === 0 && <div className="text-sm" style={{ color: "#999" }}>No comments yet.</div>}
              {(live.comments ?? []).map((c) => {
                const author = users.find((u) => u.id === c.authorId);
                return (
                  <div key={c.id} className="rounded-md bg-muted/30 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{author?.name ?? "User"} · {formatDate(c.at)}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm">{c.body}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-start gap-2">
              <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button onClick={addComment}><Send className="mr-1 h-4 w-4" />Post</Button>
            </div>
          </TabsContent>

          <TabsContent value="timer" className="mt-4 space-y-3">
            <div className="rounded-md border border-divider bg-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>Total time</div>
              <div className="mt-1 text-2xl font-bold font-mono">{hms(totalSeconds)}</div>
              <div className="mt-3 flex gap-2">
                {running ? (
                  <Button onClick={stopTimer} variant="destructive"><Square className="mr-1 h-4 w-4" />Stop</Button>
                ) : (
                  <Button onClick={startTimer} className="font-bold"><Play className="mr-1 h-4 w-4" />Start timer</Button>
                )}
              </div>
            </div>
            <div>
              <Label>Entries</Label>
              <ul className="mt-2 space-y-1 text-sm">
                {(live.timeEntries ?? []).length === 0 && <li style={{ color: "#999" }}>No time logged.</li>}
                {(live.timeEntries ?? []).map((e) => {
                  const secs = e.endedAt ? e.seconds : Math.floor((Date.now() - new Date(e.startedAt).getTime()) / 1000);
                  const author = users.find((u) => u.id === e.userId);
                  return (
                    <li key={e.id} className="flex justify-between rounded border border-divider px-3 py-1">
                      <span>{author?.name ?? "User"} · {formatDate(e.startedAt)}</span>
                      <span className="font-mono">{hms(secs)}{!e.endedAt ? " …" : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function NewTaskDialog() {
  const [open, setOpen] = useState(false);
  const users = useCRM((s) => s.users);
  const projects = useCRM((s) => s.projects);
  const contacts = useCRM((s) => s.contacts);
  const addTask = useCRM((s) => s.addTask);

  const initial = {
    projectId: "",
    title: "",
    status: "new" as import("@/lib/crm/types").TaskStatus,
    priority: "normal" as import("@/lib/crm/types").TaskPriority,
    assignedUserIds: [] as string[],
    clientContactId: "",
    description: "",
    moreInfo: "",
    dueDate: "",
    tags: "",
    visibleToClient: false,
    billable: false,
  };
  const [form, setForm] = useState(initial);

  const toggleUser = (id: string) =>
    setForm((f) => ({
      ...f,
      assignedUserIds: f.assignedUserIds.includes(id)
        ? f.assignedUserIds.filter((x) => x !== id)
        : [...f.assignedUserIds, id],
    }));

  const submit = () => {
    if (!form.projectId) { alert("Project is required"); return; }
    if (!form.title.trim()) { alert("Title is required"); return; }
    addTask({
      title: form.title.trim(),
      dueDate: form.dueDate || undefined,
      assigneeId: form.assignedUserIds[0],
      parentType: "project",
      parentId: form.projectId,
      projectId: form.projectId,
      status: form.status,
      priority: form.priority,
      assignedUserIds: form.assignedUserIds,
      clientContactId: form.clientContactId || undefined,
      description: form.description || undefined,
      moreInfo: form.moreInfo || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      visibleToClient: form.visibleToClient,
      billable: form.billable,
    });
    setForm(initial);
    setOpen(false);
  };

  const STATUS_OPTS: { id: import("@/lib/crm/types").TaskStatus; label: string }[] = [
    { id: "new", label: "New" },
    { id: "in_progress", label: "In Progress" },
    { id: "awaiting_feedback", label: "Awaiting Feedback" },
    { id: "completed", label: "Completed" },
  ];
  const PRIORITY_OPTS: { id: import("@/lib/crm/types").TaskPriority; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "low", label: "Low" },
    { id: "high", label: "High" },
    { id: "urgent", label: "Urgent" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><NewButton>New Task</NewButton></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add A New Task</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project *</Label>
            <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Status *</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTS.map((s) => (
                  <button type="button" key={s.id} onClick={() => setForm({ ...form, status: s.id })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${form.status === s.id ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Priority *</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTS.map((p) => (
                  <button type="button" key={p.id} onClick={() => setForm({ ...form, priority: p.id })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${form.priority === p.id ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Assign Users</Label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const active = form.assignedUserIds.includes(u.id);
                return (
                  <button type="button" key={u.id} onClick={() => toggleUser(u.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-divider bg-card"}`}>
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Assign Client</Label>
            <Select value={form.clientContactId} onValueChange={(v) => setForm({ ...form, clientContactId: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <textarea rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>More Information</Label>
            <textarea rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.moreInfo} onChange={(e) => setForm({ ...form, moreInfo: e.target.value })} />
          </div>

          <div className="rounded-lg border border-divider p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#666" }}>Options</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.visibleToClient} onChange={(e) => setForm({ ...form, visibleToClient: e.target.checked })} className="h-4 w-4 accent-[--maroon]" />
              Visible To Client
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} className="h-4 w-4 accent-[--maroon]" />
              Billable
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} className="font-bold">Save task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
