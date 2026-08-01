## Plan: Mayday subscription tracker UI

### Summary
Build the frontend UI for Mayday as a clean, trustworthy SaaS dashboard. Since the backend exists already, this plan focuses on screens, components, navigation, and realistic mock data that mirrors the shape your API will later return. The UI will be styled as a light, professional finance app with subtle indigo accents and crisp typography.

### Design direction
- **Visual style:** Clean light SaaS with a warm off-white background, soft slate text, and indigo accents for primary actions and active states. Cards have light borders, rounded corners, and subtle shadows.
- **Layout:** Persistent sidebar on desktop with a mobile sheet menu; top bar with search and account. Main content uses a contained max-width layout.
- **Feel:** Calm, organized, and credible — like a finance app you trust with your money.
- **Data surfaces:** totals, monthly/yearly spend, upcoming renewals, category breakdowns, and subscription status.

### Pages to build

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Dashboard: summary cards, spend chart, upcoming renewals, recent subscriptions. |
| `/subscriptions` | `src/routes/subscriptions/index.tsx` | Subscription list: searchable/filterable table/grid with status, cost, renewal date, category. |
| `/subscriptions/$id` | `src/routes/subscriptions/$id.tsx` | Subscription detail: full info, detected-from email, payment history, edit/categorize actions. |
| `/settings` | `src/routes/settings/index.tsx` | Settings / integrations: email/IMAP connection status, AI rules, categories, notification preferences. |

### Layout shell
- Create `src/routes/_app.tsx` as a pathless layout that wraps the four pages with a shared sidebar, header, and `<Outlet />`.
- Update `src/routes/__root.tsx` to render the `Sonner` toaster once and keep the global head metadata clean.

### Data model (mock layer)
A single `src/lib/subscriptions.ts` file exports a `Subscription` type plus a mock array and async helpers (`getSubscriptions`, `getSubscriptionById`, `getStats`) so components load data identically to how they will when the real API is wired in.

Core fields:
- `id`, `name`, `logo` (optional/fallback initials), `category`, `status` (active/trial/cancelled/paused)
- `billingCycle` (monthly/annual), `cost` (amount + currency), `nextRenewal`, `paymentMethod`
- `detectedFrom` (email sender/subject), `confidence` (AI confidence score), `notes`

### Components to build
- `AppSidebar`, `AppHeader`, `MobileNav`
- `StatCard`, `SpendChart` (Recharts area/bar chart), `RenewalTimeline`
- `SubscriptionTable`, `SubscriptionCard`, `StatusBadge`, `CategoryBadge`
- `SubscriptionDetailView`, `SubscriptionEditForm` (controlled, non-persisting)
- `IntegrationCard`, `CategoryManager`, `MockDataBanner` (explains data is local mock)

### Technical notes
- All routes are public (no auth gate) because the backend already owns auth and the user asked for UI only.
- Keep business logic out of the UI; helpers return plain data that the real API can later substitute without component changes.
- Use `date-fns` for date formatting and `recharts` for the spend chart.
- Use existing shadcn/ui components: Card, Button, Badge, Table, Tabs, Dialog, Input, Select, Switch, Separator, Sheet.
- Add route-specific `head()` metadata for each page (title, description, OG tags).
- Replace the placeholder index page entirely; the dashboard becomes the home view.

### Out of scope
- Real email/IMAP integration, AI categorization, or backend persistence (this is UI-only and will use mocked data shaped for the future API).
- Authentication/login flows (backend owns this).
- Real payments or webhooks.

### Deliverables
1. Shared layout with navigation and responsive mobile menu.
2. Four fully rendered pages with realistic mock data.
3. Reusable component library for cards, tables, badges, charts, and forms.
4. Clean metadata and a cohesive visual system using the existing Tailwind theme tokens.

