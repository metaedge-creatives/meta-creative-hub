
# MetaEdge Creatives CRM — v1 Plan

## Tradeoff (please confirm you're OK with this)

You asked for no Lovable Cloud. That means **no server, no shared database, no real login**. To still deliver everything you asked for, I'll build a fully-working front-end CRM that stores everything in the browser (`localStorage`):

- Data lives on **one device / one browser only** — no sync between team members. Clearing browser data wipes it.
- The "super admin" and per-user permissions are simulated in the browser (a user picker in the top bar + a permissions table in Settings). Not real security — it's a functional prototype of the workflow.
- Includes **Export / Import JSON** so you can back up or move data.

If later you want real multi-user with shared data and true auth, we'd flip Lovable Cloud on and migrate. The UI stays; only the data layer changes.

## Scope (v1)

1. **Contacts & Companies** — Companies (agencies/brands) with many Contacts. Fields: name, email, phone, title, company, tags, notes.
2. **Deals / Pipeline** — Kanban board. Stages: Lead → Qualified → Proposal → Negotiation → Won → Lost. Fields: title, company/contact, value, expected close, owner, notes.
3. **Creative Projects** — Table + detail view. Can link to a Deal **or** directly to a Contact/Company. Fields: name, brief, client, status (Brief → In Progress → Review → Delivered), deliverables checklist, deadline, owner.
4. **Tasks & Notes** — Attachable to any Contact, Deal, or Project. Task = title, due date, assignee, done/not. Note = free text + timestamp + author.
5. **Users & Permissions (Settings)** — Super admin can add team members (name, email, avatar, phone, job title) and toggle per-module access: Contacts, Deals, Projects, Tasks, Settings. Modules the current user lacks are hidden in the nav.

## App structure

```text
/                     → Dashboard (KPIs, recent activity, upcoming tasks)
/contacts             → Contacts + Companies (tabs)
/contacts/$id         → Contact detail (deals, projects, tasks, notes)
/companies/$id        → Company detail
/deals                → Kanban pipeline
/deals/$id            → Deal detail
/projects             → Projects list
/projects/$id         → Project detail (deliverables, tasks, notes)
/tasks                → All tasks (mine / all / overdue)
/settings             → Team + permissions + data export/import
```

Persistent left sidebar with the MetaEdge logo mark + white background, a top bar with global search, user switcher (to simulate different permissions), and a maroon "+ New" menu.

## Brand system (from your guidelines)

Applied strictly, no drift:

- **Colors** — Maroon `#BF1833` primary (CTAs, active nav, kanban accents, badges, top accent bar), White `#FFFFFF` canvas, Charcoal `#111111` headings only, Mid Gray `#666666` body, Light Gray `#999999` muted/labels, Divider `#E8E8E8`, Rose Tint `#FDF5F7` for tag pills and subtle highlights. **No black backgrounds anywhere, no gradients, no other accent colors.**
- **Typography** — Plus Jakarta Sans loaded via Google Fonts `<link>` in `__root.tsx`. Weights: 900 for display, 800 for card titles/badges, 700 for tag labels, 600 for emphasis, 400 for body. Headings 1.08–1.10 line-height; body 1.45–1.55; uppercase labels tracked 0.06–0.14em. No italics.
- **Components** — Cards: 9–10px radius, white fill, `0 4px 20px rgba(0,0,0,0.09)` shadow, thin top maroon accent border on primary cards (kanban columns, stat tiles). Tag pills: rose-tint background, maroon 700-weight text. Numbered badges (01, 02…) on white-on-maroon circles reused for stage indicators and step lists.
- **Motion/texture** — Restrained. No gradients. Optional subtle circuit-pattern texture at 22% opacity behind the dashboard hero only (matches the deck) — I'll leave a hook for it, off by default.
- **Footer** in-app: dark bar with website + email left, tag pills right, per the guide.

## Technical details

- **Stack:** existing TanStack Start template, shadcn/ui, Tailwind v4. No Cloud, no server functions, no auth middleware.
- **Data layer:** Zustand store with `localStorage` persist middleware under one namespaced key. Entities: `companies`, `contacts`, `deals`, `projects`, `tasks`, `notes`, `users`, `currentUserId`. Seeded on first run with one super-admin user and empty collections.
- **Permissions:** each `User` has `permissions: { contacts, deals, projects, tasks, settings: boolean }` + `isSuperAdmin`. A `useCan()` hook + `<RequirePermission>` wrapper gate routes and nav items. Only super admins can edit permissions or promote another user.
- **Routing:** file-based routes in `src/routes/`. Shared app shell (sidebar + topbar) lives in a pathless `_app.tsx` layout with `<Outlet />`. Home `/` replaces the placeholder with the Dashboard.
- **Design tokens:** all brand colors mapped in `src/styles.css` under `@theme inline` as semantic tokens (`--primary` = maroon, `--foreground` = charcoal, `--muted-foreground` = mid gray, plus `--rose-tint`, `--divider`, `--maroon`) — components use tokens, never hex.
- **Head/SEO:** proper title/description per route ("MetaEdge Creatives CRM — Contacts", etc.).
- **Forms:** `react-hook-form` + `zod`.
- **Export/Import:** Settings screen has "Download backup" and "Restore from file" buttons for the full JSON blob.

## Out of scope for v1

- Real authentication and multi-device sync (needs Cloud).
- Email sending, calendar sync, file uploads, invoicing.
- CSV import (JSON export/import only).
- Audit log / activity history beyond a simple recent-activity feed.

## Implementation order

1. Brand tokens + Plus Jakarta Sans + base primitives
2. Data store, types, seed
3. App shell (sidebar, topbar, user switcher, permissions gating)
4. Contacts & Companies
5. Deals kanban
6. Projects
7. Tasks & Notes
8. Settings (team + permissions + export/import)
9. Dashboard
10. Polish pass against the brand spec

Approve and I'll start building.
