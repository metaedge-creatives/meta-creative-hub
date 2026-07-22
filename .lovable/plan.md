# MetaEdge CRM — Big Feature Round

Scope bohot bara hai. Isko chhote saaf phases mein todta hoon taki kuch bhi toota na rahe.

## Phase 1 — Code health pass
- `src/routes/` aur `src/lib/crm/` ke har file ka type-check aur lint pass karwana.
- Broken imports, unused code, aur console warnings clean karna.
- Ye phase koi feature nahi todta — sirf existing bugs fix.

## Phase 2 — Client Portal redesign (sidebar match)
Screenshot jaisa look — team sidebar ke identical style mein — client portal ke liye:
- Logo + "MetaEdge Creatives · Portal" header
- Grouped nav (OVERVIEW / MY WORK / BILLING / SUPPORT)
- Icons badges (rounded pill background, red primary on active)
- Bottom user card (client name + "CLIENT")
- Collapsible + mobile drawer

New menu items add honge (details neeche).

## Phase 3 — Projects & Progress (client-side)
- Client portal mein naya **"My Projects"** route: sirf apne projects (company/contact match).
- Har project card mein: name, status pill, deadline, deliverables progress bar (`done / total`), overall %.
- Project detail page: milestones list, deliverables checklist (read-only), timeline, latest updates.
- Team side pe existing project page mein "Client visibility" toggle — jo cheezein client ko dikhani hain.

## Phase 4 — Reports (weekly / monthly)
- Team side: `Reports` module already hai. Isme "Send to client" action add karunga — report ek `clientReports` list mein save hoti hai (client + period + summary + metrics).
- Client portal mein naya **"Reports"** route — apni saari weekly/monthly reports read karna, PDF download.

## Phase 5 — Services & Proposals (client-initiated)
- Client portal mein naya **"Services"** route: `products` list se services dikhengi, plus "Request custom" form (title + description + budget).
- Client request submit kare → team side `Requests` inbox mein aata hai.
- Team us request se **Proposal** bana ke bhej sake (existing `proposals` list use karke, `clientName` set karke).
- Client portal mein naya **"Proposals"** route: accept / decline buttons.

## Phase 6 — Payments module (toggleable)
- **Settings → Modules** page pe "Payments" toggle. Off = client portal mein Pay button + checkout hidden, sidebar item hidden.
- Toggle on karne pe **Stripe connect banner** dikhega admin ko: "Connect Stripe to accept payments." Button dabate hi Lovable seamless Stripe payments enable hoga (mujhe tumhari confirmation chahiye — Q1 neeche).
- Client portal invoice page pe "Pay now" button — checkout session banake redirect.
- Payments module off ho to sab kuch invisible.

## Phase 7 — Email notifications
- Jab team invoice / contract / proposal / report bheje, client ko email bhi jaye.
- Iske liye email provider chahiye (Q2 neeche).

## Phase 8 — Data persistence reality check
Filhaal saara data `localStorage` mein hai (single browser). Iska matlab:
- Client ne apne phone se signup kiya → tumhare laptop pe nahi dikhega. (Ye tumne already dekha.)
- Email, Stripe webhooks, real project sync — sab ke liye asli backend chahiye.
- Recommendation: **Lovable Cloud enable karo** (Q3 neeche). Iske bina Phase 6 (real Stripe) aur Phase 7 (real email) sirf UI-only demos rahenge.

---

## Sawaal (jawab do phir shuru karta hoon)

**Q1 — Stripe:** Lovable ka built-in seamless Stripe (koi API key nahi chahiye, Lovable handle karta hai) use karun, ya tum apna Stripe account connect karna chahte ho (BYOK)?

**Q2 — Email:** Resend connector use karun (Lovable ka standard) ya kuch aur (SendGrid/Mailgun)?

**Q3 — Backend:** Lovable Cloud enable karun? Iske bina cross-device sync, real emails, aur Stripe webhooks kaam nahi karenge. (Strongly recommended.)

**Q4 — Priority order:** Sab ek saath karun (bara PR) ya phase-wise ship karun (Phase 1+2 pehle, phir rest)? Phase-wise safer hai.

Jawab do to plan finalize karke build shuru karta hoon.
