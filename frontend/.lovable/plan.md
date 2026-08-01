## Goal

Build the local subscription-tracker frontend as a full UI on TanStack Start with mock data, styled per the selected "Terminal utility" direction. All data reads/writes go through a thin API-client layer pointed at `VITE_API_BASE_URL` — but every hook falls back to bundled fixtures when the backend is unreachable, so the app is fully browsable in preview.

## Design tokens (locked from selected prototype)

Ported verbatim into `src/styles.css`:
- Fonts: Inter (sans), JetBrains Mono (mono), loaded via `<link>` in `__root.tsx`
- Colors: `--surface-base #09090b`, `--surface-panel #18181b`, `--accent-primary #a1a1aa`, zinc scale, emerald/amber/blue status dots
- Composition: 256px sidebar + main; 64px top strip with monthly/annual totals + Refresh Sync/Add New buttons; dashboard is a 12-col grid (renewals 8 / allocation 4 / activity 12)

## Routes (`src/routes/`)

```
__root.tsx           — shell: font links, sidebar layout wrapper, <Outlet/>
index.tsx            — Dashboard
subscriptions.tsx           — layout (<Outlet/>)
subscriptions.index.tsx     — list w/ Credit/Debit/UPI tabs + category/status filters
subscriptions.$id.tsx       — detail: fields + renewal history table
payment-methods.tsx
accounts.tsx         — 10 Gmail accounts, Connect/Reconnect/Backfill, last-synced
settings.tsx         — alert timing, notification method
```

Each route gets its own `head()` (title + description). Nav uses `<Link>`, not `<a href>`.

## Components (`src/components/`)

- `AppSidebar` — nav from the prototype (Dashboard / Subscriptions / Gmail Accounts / Payment Methods / Analytics / Settings), footer user chip
- `TopStrip` — monthly + annual totals, action buttons; used across pages
- `SubscriptionCard`, `SubscriptionsTable`, `RenewalTimeline`
- `SpendChart` — Recharts category bars (matches prototype's stacked bar style)
- `AlertsFeed`, `AccountConnectionRow`, `StatusBadge`

## Data layer

- `src/lib/api-client.ts` — `fetch` wrapper reading `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:8000`)
- `src/lib/mock-data.ts` — realistic fixtures: ~12 subscriptions (Netflix, Spotify, ChatGPT, AWS, Notion, Framer, Claude Pro, etc.), 3 payment methods, 10 Gmail accounts with staggered last-synced times, alerts feed
- `src/hooks/useSubscriptions.ts`, `usePaymentMethods.ts`, `useAccounts.ts`, `useSettings.ts` — React Query hooks that try the API and fall back to mock data on error; mutations optimistically update the query cache
- TanStack Query already provided by the template; QueryClient wired in `src/router.tsx`

## Build order

1. Port design tokens into `src/styles.css`; add font links in `__root.tsx`
2. Sidebar layout in `__root.tsx` + `AppSidebar`
3. Mock data + API client + React Query hooks
4. Dashboard (`index.tsx`) — TopStrip, renewals table, allocation chart, activity feed
5. Subscriptions list + detail
6. Payment methods
7. Connected accounts
8. Settings

## Technical notes

- TanStack Start, so file-based routing under `src/routes/`; the layout lives in `__root.tsx` (no `_app` folder)
- No auth, no Lovable Cloud — single-user local tool
- No SSR data fetching in loaders; all reads happen in components via `useQuery`, so `VITE_API_BASE_URL` being unreachable during build/prerender is fine
- Recharts added via `bun add recharts`
