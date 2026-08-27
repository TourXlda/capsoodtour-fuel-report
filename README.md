# Capsood Fuel Report

Next.js app for Capsood fuel expense reporting.

## Product scope

- **Vehicles** — name, plate number, fuel type, status
- **Fuel expense entry** — date, vehicle, driver, odometer, liters, price/liter, total, optional notes
- **Dashboard** — monthly fuel cost, cost by vehicle, average consumption, cost per km
- **Filters** — date range, vehicle, driver
- **Export** — Excel (driver reporting, fuel pricing, distance)

## Requirements

- Node.js 20+
- Supabase project

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and set Supabase URL + key + site URL
3. Apply `supabase/migrations/` to your project
4. Configure Auth redirect URLs (`/auth/callback`, `/reset-password`) and SMTP
5. `npm run dev` → [http://localhost:3000](http://localhost:3000) (`/login`)

> `AUTH_PROXY_ENABLED` in `proxy.ts` is `true` — Supabase env keys are configured, so
> proxy-based session/role guarding is active.

## Roles

| Role | Access |
|------|--------|
| **Client (driver)** | Fuel report entry, own expenses, client dashboard |
| **Admin** | Vehicles, all expenses, analytics dashboard, exports |

## Main routes (scaffolded)

| Path | Purpose |
|------|---------|
| `/fuel-report` | Fuel expense entry form |
| `/client-dashboard` | Driver history + filters |
| `/admin-dashboard` | Fleet analytics + vehicle DB + export |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run lint` | ESLint |
