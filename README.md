# MyMoney

A personal finance / money-management web app — a responsive, database-backed web
version of the MyMoney mobile application.

Dark charcoal canvas, warm cream text, pale-yellow accents, soft green income and
coral expenses. Multi-currency (BDT by default, plus USD / EUR / GBP), with real
CRUD, real aggregation, real charts, budgets, transfers, search, filters, exports
and JSON backup/restore.

Built with **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma 6 · PostgreSQL (Neon) · Auth.js (NextAuth v5) · Zod · Recharts · Lucide**.

---

## 1. Getting started

```bash
npm install                 # installs deps (Prisma client generated via postinstall)
cp .env.example .env        # then fill in DATABASE_URL / DIRECT_URL / AUTH_SECRET
npx prisma migrate dev      # create + apply migrations (uses DIRECT_URL)
npm run db:seed             # seed currencies, categories, accounts, sample data
npm run dev                 # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

The seed creates a demo account together with sample accounts, categories,
budgets and one transaction, so the Records screen has data immediately. The
seeded credentials are defined in `prisma/seed.ts` — change them there before
seeding (or delete the user afterwards) if you do not want a demo login to exist.

### Local database without Neon

Any PostgreSQL works. For a throwaway local instance:

```bash
docker run -d --name mymoney-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=mymoney \
  -p 5433:5432 postgres:16-alpine
```

then set both `DATABASE_URL` and `DIRECT_URL` to:

```
postgresql://postgres:postgres@localhost:5433/mymoney?schema=public
```

Stop / remove it with `docker stop mymoney-pg && docker rm mymoney-pg`.

> **Note on `NODE_ENV` / `omit=dev`:** this machine exports `NODE_ENV=production`
> and sets `npm config omit=dev`. A project `.npmrc` with `include=dev` is included
> so `npm install` still pulls TypeScript, ESLint and the Tailwind PostCSS plugin —
> all required by `npm run build`. Production installs can still opt out with
> `npm ci --omit=dev`.

---

## 2. Environment variables

| Variable       | Required | Purpose                                                              |
| -------------- | -------- | -------------------------------------------------------------------- |
| `DATABASE_URL` | yes      | Neon **pooled** connection string used by the app at runtime.        |
| `DIRECT_URL`   | yes      | Neon **direct** connection string used by `prisma migrate` / studio.  |
| `AUTH_SECRET`  | yes      | Signing secret for Auth.js session cookies. `npx auth secret`.       |
| `AUTH_URL`     | no       | Only when deployed behind a custom domain.                           |
| `AUTH_TRUST_HOST` | no    | Set to `true` when not on Vercel.                                    |
| `NEXT_PUBLIC_APP_URL` | no | Absolute app URL used for links in exports.                        |

`.env` is git-ignored; `.env.example` is committed. Secrets are never committed.

---

## 3. Authentication

Auth.js (NextAuth v5) with a **Credentials** provider and **JWT sessions**.

- `lib/auth/index.ts` — provider config, `session`/`jwt` callbacks that carry `user.id`.
- `lib/auth/password.ts` — bcrypt hashing (10 rounds) and verification.
- `app/api/auth/[...nextauth]/route.ts` — the Auth.js route handler.
- `lib/auth/session.ts` — `requireUser()` (pages, redirects to `/login`),
  `requireUserId()` (server actions, throws a safe error instead of redirecting).
- `proxy.ts` is intentionally **not** used. Route protection happens in the
  `(dashboard)` layout via `requireUser()`, and **every** service query is scoped
  to the authenticated `userId`, so ownership is enforced at the data layer.

Routes: `/login`, `/register`, `/forgot-password`. Everything under
`/records`, `/analysis`, `/budgets`, `/accounts`, `/categories`, `/settings`
requires a session.

> Password **reset** is wired end-to-end (route, action, neutral response that
> never leaks whether an email exists) but no SMTP provider is configured, so the
> request is only recorded server-side. See *Limitations*.

---

## 4. Project structure

```
app/
  (auth)/                    # public auth pages + register server action
    login/ register/ forgot-password/
  (dashboard)/               # authenticated shell (sidebar + bottom nav)
    layout.tsx
    records/                 # primary screen + transaction/transfer actions
    analysis/                # expense/income/flow/account analysis
    budgets/
    accounts/[id]/
    categories/
    settings/                # index, preferences, security, export, backup, [section]
    search-actions.ts        # global search + filter options
  api/auth/[...nextauth]/     # Auth.js handler
  error.tsx  not-found.tsx  layout.tsx  page.tsx  globals.css

components/
  layout/    AppShell, Sidebar, MobileDrawer, MobileBottomNav, PageHeader
  records/   MonthSelector, FinancialSummary, TransactionList, TransactionDialog,
             TransactionDetails, TransactionFilters, RecordsView
  accounts/  AccountCard, AccountDialog, AccountDetail, AccountsView
  categories/ CategoryList, CategoryDialog, CategoriesView
  budgets/   BudgetCard, BudgetDialog, BudgetProgress, BudgetsView
  analysis/  AnalysisView
  charts/    CategoryDonut, CategoryBarChart, FlowChart (area/line)
  settings/  PreferencesForm, ChangePasswordForm, ExportPanel, BackupPanel
  search/    SearchDialog
  common/    MoneyDisplay, IconBadge, IconPicker, ConfirmDialog, Brand,
             AccentSync, loading skeletons
  ui/        Button, Input/Select/Textarea/Label, Card, Modal, Segmented,
             Switch, Dropdown, Toast

lib/
  db/prisma.ts               # singleton PrismaClient
  auth/                      # index (NextAuth), password, session
  currency/                  # centralised currency metadata + formatting
  finance/                   # money (Decimal math), dates, ranges
  services/                  # transactions, transfers, accounts, categories,
                             # budgets, analysis, preferences, search, export,
                             # backup, reset  — all data access lives here
  validations/               # Zod schemas (auth, transaction, finance, shared)
  actions/result.ts          # ActionResult + safe error mapping
  hooks/use-is-client.ts
  icons.ts  palette.ts  nav.ts  constants.ts  query.ts  utils.ts

prisma/  schema.prisma  seed.ts  migrations/
scripts/ register-aliases.mjs  verify-finance.ts
types/   next-auth.d.ts
```

---

## 5. Database schema

PostgreSQL + Prisma. All money is `Decimal(18,4)` — **never** float/double.

| Model | Key fields | Notes |
| --- | --- | --- |
| `User` | `id, name, email(unique), passwordHash, defaultCurrency` | roots every other record |
| `Currency` | `code(pk), name, symbol, flag, decimalPlaces, isActive` | BDT, USD, EUR, GBP |
| `Account` | `userId, name, type, currencyCode, openingBalance, icon, color, isActive` | `currentBalance` is **derived**, never stored |
| `Category` | `userId, name, type(income\|expense), icon, color, isActive, sortOrder` | `@@unique([userId, name, type])` |
| `Transaction` | `userId, accountId, categoryId?, type, amount, currencyCode, exchangeRate, baseAmount, transactionDate, note` | `baseAmount` preserves reporting in the base currency |
| `Transfer` | `userId, fromAccountId, toAccountId, fromAmount/fromCurrency, toAmount/toCurrency, exchangeRate, transactionDate` | never counts as income/expense |
| `Budget` | `userId, name, amount, currencyCode, periodType(weekly\|monthly\|custom), startDate, endDate?, isActive` | |
| `BudgetCategory` | `budgetId, categoryId` | `@@unique([budgetId, categoryId])` |
| `UserPreference` | `userId(unique), defaultCurrency, theme, accentColor, dateFormat, numberFormat, timezone, firstDayOfWeek, notification flags` | 1:1 with `User` |

Enums: `AccountType`, `CategoryType`, `TransactionType`, `BudgetPeriod`, `ThemeMode`.

Indexes: `Transaction(userId, transactionDate)`, `(userId, accountId)`,
`(userId, categoryId)`, `(userId, type, transactionDate)`; `Account(userId, isActive)`;
`Category(userId, type, sortOrder)`; plus indexes on transfer/budget foreign keys.
Cascades: deleting a `User` removes everything they own; deleting an `Account`
cascades its transactions; deleting a `Category` sets `Transaction.categoryId` to
`NULL` so history is preserved.

### Money & currency rules

- Formatting lives in exactly one place — `lib/currency/index.ts` — with
  `formatMoney(value, code)`. It formats from the **decimal string**, never via a
  float, so `৳20,000.00` / `$1,250.00` / `€850.00` / `£700.00` are exact.
- Exact arithmetic uses `Prisma.Decimal` (`lib/finance/money.ts`).
- A transaction stores its original `amount` + `currencyCode`, the `exchangeRate`
  used, and the `baseAmount` in the user's default currency. The original amount is
  never lost.
- `exchangeRate` is defined as **base-currency units per 1 unit of the transaction
  currency**. Cross-currency entries require a rate and are rejected with
  *“Currency conversion rate missing.”* otherwise. The service is structured so a
  live rate provider can be dropped in (no calls are made today).

---

## 6. Financial rules (implemented and verified)

```
Account balance = openingBalance
                + Σ income
                − Σ expense
                + Σ incoming transfers
                − Σ outgoing transfers
```

Transfers move money between accounts and **never** affect income or expense.
Monthly totals are aggregated with grouped SQL (`groupBy`), not by loading rows.

Run the automated data-layer checks against your database:

```bash
npm run verify:data      # 49 assertions: balances, transfers, FX, isolation,
                         # backup/restore, export, reset
```

---

## 7. Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint (flat config). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run db:migrate` | `prisma migrate dev`. |
| `npm run db:deploy` | `prisma migrate deploy` (production). |
| `npm run db:seed` | Seed currencies, categories, accounts, sample data. |
| `npm run db:studio` | Prisma Studio. |
| `npm run verify:data` | Financial/data verification suite. |

---

## 8. Features

**Records** — month navigation (prev / next / back-to-current), dynamically
computed Expense / Income / Total summary, transactions grouped by day with
category icons, account name and note, click-through to a details sheet with
**View / Edit / Duplicate / Delete** (destructive actions confirmed), and a
floating **+** that opens one form handling **Expense / Income / Transfer**.

**Accounts** — cash / bank / card / mobile-wallet / savings / other, per-account
currency and opening balance, accurate derived balances, active/inactive, a detail
page with balance breakdown + statement, and account analysis.

**Transfers** — same-currency and cross-currency (rate stored and displayed);
never counted as income or expense.

**Categories** — income and expense sections, custom icon + colour, rename,
change icon/colour, reorder (move up/down), disable/enable, delete (keeps history).

**Budgets** — weekly / monthly / custom periods, category-linked, with
spent / remaining / % used and **Healthy · Warning · Exceeded** states.

**Analysis** — selector for *Expense overview · Income overview · Expense flow ·
Income flow · Account analysis* with donut, bar and area/line charts (Recharts),
day/week/month granularity and date-range presets (this month, last month, last 3/6
months, this year, custom).

**Search & filters** — debounced global search across transactions, transfers,
categories, accounts and notes; filter panel by type, account, category, currency,
date range, amount range and sort order.

**Export** — CSV and PDF (jsPDF + AutoTable) for current month, last month, this
year, all time or a custom range, with a total income / expense / net summary.

**Backup & restore** — JSON export of accounts, categories, transactions,
transfers, budgets, preferences, currencies and exchange rates. Restore validates
the file, shows a **preview**, asks for confirmation, and supports **merge**
(keeps existing data) or **replace** (clears first). Passwords are never included.

**Delete & reset** — scoped destructive actions; *delete everything* requires
typing `DELETE` (enforced client- and server-side).

**Preferences** — default currency, language, first day of week, date format,
number format, timezone, dark/light/system theme, accent colour, and
budget/monthly-summary/large-transaction notifications. **Security** — change
password (current password verified) and session sign-out.

**Design & UX** — CSS-variable design tokens (no scattered hex values), dark
charcoal/gray-green canvas with cream text, mobile-first layout (bottom nav, slide
drawer, FAB, sheet-style dialogs) and a left sidebar on desktop, skeleton loaders
on every route, empty states, friendly errors (raw DB errors only ever logged
server-side), reduced-motion support and PWA-friendly metadata.

---

## 9. Known limitations

1. **Reference screenshots** were not available in the build environment, so the
   visual design follows the written specification (colours, hierarchy, layout,
   components) rather than a pixel comparison against the images.
2. **Password reset email** is not sent — no SMTP provider is configured. The
   route, validation and neutral response exist; wire an email provider to complete it.
3. **Live exchange rates** are not fetched. Cross-currency amounts require a
   manually supplied rate; `lib/finance/money.ts` + the transaction/transfer
   services are structured so a rate provider can be added without schema changes.
4. **Budgets are tracked in the user's default currency.** Mixed-currency budget
   targets would need a rate provider to compare against base-currency spending.
5. **Sessions are stateless JWTs**, so individual sessions cannot be listed or
   revoked; changing a password invalidates other sessions only on expiry. A
   database session strategy plus an `Account`/`Session` model would enable a full
   session manager.
6. **Transfer restore is additive in *merge* mode** — transactions/transfers have no
   natural key, so re-importing the same file in merge mode duplicates them. Use
   **replace** to restore an exact snapshot.
7. Browser-automation tooling was unavailable in this environment, so interactive
   flows were verified via HTTP-level server-action calls plus the
   `npm run verify:data` suite rather than a scripted browser session.
