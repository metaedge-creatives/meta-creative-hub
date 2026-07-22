import { useState } from "react";
import { useCRM } from "@/lib/crm/store";
import { useCurrentUser, formatDate, initials } from "@/lib/crm/hooks";
import type { ParentType } from "@/lib/crm/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NotesPanel({ parentType, parentId }: { parentType: ParentType; parentId: string }) {
  const user = useCurrentUser();
  const notes = useCRM((s) =>
    s.notes.filter((n) => n.parentType === parentType && n.parentId === parentId),
  );
  const users = useCRM((s) => s.users);
  const addNote = useCRM((s) => s.addNote);
  const deleteNote = useCRM((s) => s.deleteNote);
  const [body, setBody] = useState("");

  return (
    <div className="rounded-xl border border-divider bg-card brand-shadow p-6">
      <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Notes</div>
      <div className="space-y-2">
        <Textarea
          placeholder="Write a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (!body.trim() || !user) return;
              addNote({ body: body.trim(), parentType, parentId, authorId: user.id });
              setBody("");
            }}
            className="font-bold"
          >
            Add note
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {notes.length === 0 && (
          <p className="text-sm" style={{ color: "#999" }}>No notes yet.</p>
        )}
        {notes.map((n) => {
          const author = users.find((u) => u.id === n.authorId);
          return (
            <div key={n.id} className="rounded-lg border border-divider p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-extrabold text-primary">
                    {initials(author?.name ?? "?")}
                  </span>
                  <span className="font-bold">{author?.name ?? "Unknown"}</span>
                  <span style={{ color: "#999" }}>· {formatDate(n.createdAt)}</span>
                </div>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "#666" }}>{n.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TasksPanel({ parentType, parentId }: { parentType: ParentType; parentId: string }) {
  const tasks = useCRM((s) =>
    s.tasks.filter((t) => t.parentType === parentType && t.parentId === parentId),
  );
  const users = useCRM((s) => s.users);
  const addTask = useCRM((s) => s.addTask);
  const toggleTask = useCRM((s) => s.toggleTask);
  const deleteTask = useCRM((s) => s.deleteTask);
  const [title, setTitle] = useState("");

  return (
    <div className="rounded-xl border border-divider bg-card brand-shadow p-6">
      <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Tasks</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addTask({ title: title.trim(), parentType, parentId });
          setTitle("");
        }}
        className="flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task and press enter"
          className="flex-1 rounded-md border border-divider bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <Button type="submit" className="font-bold">Add</Button>
      </form>
      <ul className="mt-4 space-y-1.5">
        {tasks.length === 0 && <li className="text-sm" style={{ color: "#999" }}>No tasks yet.</li>}
        {tasks.map((t) => {
          const assignee = users.find((u) => u.id === t.assigneeId);
          return (
            <li key={t.id} className="flex items-center gap-3 rounded-md border border-divider px-3 py-2">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="h-4 w-4 accent-[--maroon]"
              />
              <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`} style={t.done ? { color: "#999" } : undefined}>
                {t.title}
              </span>
              {assignee && (
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#999" }}>
                  {assignee.name}
                </span>
              )}
              <button
                onClick={() => deleteTask(t.id)}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}