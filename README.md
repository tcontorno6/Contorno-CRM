# Contorno CRM — Advisor Prospect & Leads Tracker

A lightweight CRM built for financial advisors to track incoming leads, where they
came from, every interaction, and to get coaching on how to convert and grow lead flow.
Built with React + Vite. All data lives locally in your browser — no server, no accounts.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). To open the project in VS Code,
run `code .` from this folder, then use the built-in terminal for the commands above.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Deploying a shareable link

This is a static single-page app, so it deploys anywhere that can serve files.

**1. Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit: Contorno CRM"
git branch -M main
git remote add origin https://github.com/<your-username>/contorno-crm.git
git push -u origin main
```

**2a. Vercel (recommended)** — go to vercel.com, "Add New… → Project", import the
`contorno-crm` repo, and click Deploy. Settings are auto-detected (Framework: Vite,
Build: `npm run build`, Output: `dist`) and also pinned in `vercel.json`. You get a
`https://contorno-crm.vercel.app` URL; every `git push` auto-redeploys.

**2b. Render (alternative)** — go to render.com, "New + → Static Site", connect the repo.
Build command `npm install && npm run build`, Publish directory `dist`. The included
`render.yaml` also lets you deploy via "New + → Blueprint". You get an `onrender.com` URL.

> **Important — data is per-browser.** Everyone who opens the link gets their own copy of
> the app, but the data they enter is stored only in *their* browser (localStorage). The
> link is shareable; the data is **not** shared between people. For a true multi-user CRM
> with one shared database, you'd add a backend + database (e.g. a Render web service with
> Postgres) — happy to build that as a next step.

## Features

- **Dashboard** — KPIs (open leads, pipeline value, conversion rate, monthly goal),
  an 8-week lead-flow chart, source breakdown, follow-ups due today/overdue, a recent
  activity feed, a pipeline snapshot, and a **revenue forecast** (weighted pipeline).
- **Today** — a daily task & follow-up queue. Standalone tasks plus every lead's
  follow-up date, grouped into overdue / today / next 7 days / later, with one-click
  complete, snooze (+1d / +1w), and quick-add.
- **Pipeline** — a drag-and-drop kanban board across 7 stages (New → Contacted →
  Qualified → Meeting → Proposal → Client / Lost).
- **Leads** — searchable, filterable, sortable table of every prospect.
- **Lead detail** — full profile with estimated AUM, annual fee, and lifetime value;
  click-to-advance stage stepper; a complete contact log; quick-log buttons; working
  notes with inline coaching; a **Meeting prep** brief; and, once the prospect becomes a
  Client, a **client onboarding checklist** (IMA, Form CRS, ACAT, and more).
- **Meeting prep** — a printable one-page brief generated from the lead's history:
  snapshot, last conversation, open concerns, suggested talking points, and next steps.
- **Revenue forecast** — each prospect's AUM is turned into an annual fee (configurable,
  default 1%) and a lifetime value (annual fee × average client lifespan). The dashboard
  shows a probability-weighted pipeline forecast by stage.
- **Contact Log** — a global, day-grouped feed of every interaction across all prospects.
- **Activity Heatmap** — a GitHub-style contribution calendar of your interactions plus a
  day-of-week × time-of-day grid, so you can see your outreach rhythm and protect your best
  windows. Includes streak, busiest day, and peak-time stats.
- **Coaching & Insights** — source mix and per-source close rates, plus tailored,
  data-driven suggestions for growing your lead flow (referrals, events, COI partners,
  follow-up speed, channel diversification, re-engaging cold leads, and more).
- **Note coaching** — after any note, you get an instant read: a quality score, what's
  working, and specific ways to improve (objection handling, next steps, discovery depth…).
- **Settings** — advisor profile and monthly goal, plus JSON export/import backup,
  reset to demo data, and clear-all.

## Data & persistence

Everything is stored in your browser's `localStorage` under the key `advisor-crm-v1`.
It persists between sessions on the same browser. Use **Settings → Export backup** to save
a JSON file (and **Import** to restore it or move to another machine).

## Swapping in the Claude API for coaching

The coaching is rule-based and offline by default (no API key needed). The UI calls two
async wrappers in `src/utils/coaching.js`:

- `getNoteFeedback(text, lead)` — feedback on a single note
- `getFlowSuggestions(leads, interactions)` — portfolio-level lead-flow ideas

To use real Claude-generated coaching, replace the bodies of those two functions with a
call to your backend / the Anthropic API, and map the response into the same shape the UI
expects:

```js
// note feedback shape
{ score: 0-100, sentiment: 'positive'|'neutral'|'cautious', summary: string,
  strengths: string[], suggestions: string[] }
```

Nothing else in the app needs to change.

> Security note: never put an Anthropic API key directly in this front-end. Proxy the call
> through a small backend so the key stays server-side.

## Project structure

```
src/
  data/         constants.js, seed.js          (stages, sources, demo data)
  utils/        storage, format, stats, coaching
  context/      StoreContext.jsx               (state + CRUD, localStorage)
  components/    Sidebar, Modal, LeadForm, InteractionForm, NoteFeedback, Badge, ui
  pages/        Dashboard, Pipeline, Leads, LeadDetail, ContactLog, Insights, Settings
```

## Tech

React 18, Vite 5, Recharts (charts), lucide-react (icons). No CSS framework — a small
hand-written design system in `src/index.css`.
