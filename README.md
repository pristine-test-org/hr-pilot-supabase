# HR Pilot (Supabase)

A practice HR SaaS app: one landing page, a simple login, and a dashboard with four modules:
**Leaves**, **Payroll**, **Claims** and **Settings**. It is seeded with an admin account and a
20-person software company.

This version has **no custom server**. It is a static single-page app that talks to Supabase
directly, and all the security lives in the database.

## Tech stack

- **Vite + React 19 + TypeScript** with **React Router**. The build is a static `dist/` folder.
- **Tailwind CSS v4** + **shadcn/ui** (built on Base UI), sonner and lucide-react for the interface.
- **Supabase Auth** for sign-in (email + password; the login form turns a username into
  `<username>@hrpilot.test`).
- **Supabase Postgres** with **row level security**. The browser uses supabase-js with the public
  (publishable) key, and Postgres decides what each signed-in user may read or change.

## How the rules are enforced

Everything is in `supabase/migrations/20260923120000_init.sql`:

| Rule | Where |
| --- | --- |
| Employees see only their own profile, leaves, claims and payslips; admins see everyone's | RLS `select` policies using the `security definer` helper `public.is_admin()` |
| Employees create leaves/claims only for themselves, always `PENDING` | RLS `insert` policies + `before insert` triggers that set `user_id`, `status`, decision fields and the leave's day count |
| Only admins approve or reject | `decide_leave_request()` / `decide_claim()` RPCs check `is_admin()`; nobody has `UPDATE` or `DELETE` on those tables |
| Employees edit only their name and email, never their role or HR fields | RLS `update` policy + `guard_profile_update()` trigger; admins may edit any profile |
| Payslips are read-only | `select`-only grant and policy |
| Signed-out visitors can read nothing | no grants to `anon` |

`bun run check:rls` proves these rules through the real API (see below).

## Local setup

You need Docker running and the [Supabase CLI](https://supabase.com/docs/guides/local-development)
and [bun](https://bun.sh).

```bash
supabase start          # first run pulls the Docker images
supabase db reset       # applies supabase/migrations and supabase/seed.sql
cp .env.example .env.local
```

Put the values `supabase start` printed (or `supabase status` shows) into `.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

(`VITE_SUPABASE_ANON_KEY` with the legacy anon JWT also works.) Then:

```bash
bun install
bun dev                 # http://localhost:3103
```

Supabase Studio is at http://127.0.0.1:54323. Running `supabase db reset` again at any time
restores the clean demo data.

### Useful scripts

| Command | What it does |
| --- | --- |
| `bun dev` | Vite dev server on port 3103 |
| `bun run build` | Type-checks and builds `dist/` |
| `bun run preview` | Serves the built `dist/` on port 3103 |
| `bun run lint` | ESLint |
| `bun run check:rls` | Signs in as `ahmad.faiz` and `admin` and checks the RLS rules through the API (adds one leave and one claim; `supabase db reset` cleans up) |
| `bun run db:types` | Regenerates `src/lib/database.types.ts` from the local database |

## Deploy

The backend is a Supabase project and the frontend is static files on Netlify.

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Push the schema from this repo:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Optional, for demo data: run `supabase/seed.sql` in the dashboard's SQL editor. It creates the
   demo accounts below; don't do this on a project with real users.
4. In the Supabase dashboard, open **Authentication > Sign In / Providers** and turn off
   **Allow new users to sign up**. There is no sign-up page; HR provisions accounts. Also set
   **Site URL** under **Authentication > URL Configuration** to your Netlify URL.
5. On Netlify, import the repository. `netlify.toml` already sets the build command
   (`bun run build`), the publish directory (`dist`) and the single-page-app fallback. Under
   **Site configuration > Environment variables**, set:
   - `VITE_SUPABASE_URL`: the project URL (`https://<ref>.supabase.co`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: the publishable key from **Project Settings > API Keys**

   Both values are public; they are baked into the bundle at build time, so redeploy after
   changing them.

Any other static host works the same way: build with those two variables set, serve `dist/`, and
rewrite unknown paths to `/index.html`.

## Demo credentials

Credentials are also shown on the login page.

| Role     | Username     | Password      |
| -------- | ------------ | ------------- |
| Admin/HR | `admin`      | `admin`       |
| Employee | `ahmad.faiz` | `password123` |

All 20 seeded employees share the password `password123`, with usernames in `firstname.lastname`
format (e.g. `wei.jian`, `priya.sharma`, `farah.aziz`; the full list is in `supabase/seed.sql`).
Behind the scenes each account's Supabase Auth email is `<username>@hrpilot.test`. The email shown
and edited in Settings is a separate contact address on the profile.

New passwords set from Settings must be at least 6 characters (Supabase Auth's minimum). The seeded
`admin` password is shorter because it was hashed directly in SQL.

## Project structure

```
src/
  App.tsx                   Routes (landing, login, /dashboard/*)
  pages/                    Landing, login, dashboard layout + the four module pages
  components/               shadcn/ui primitives and feature components
  lib/supabase.ts           supabase-js client and row types
  lib/auth.ts               Auth context hooks (provider in components/auth-provider.tsx)
  lib/database.types.ts     Generated by `supabase gen types`
supabase/
  config.toml               Local stack config (sign-ups off, site URL http://localhost:3103)
  migrations/               Schema, RLS policies, triggers, RPCs
  seed.sql                  Admin + 20 employees + sample leaves, claims, payslips
scripts/check-rls.ts        RLS checks through the API
netlify.toml                Netlify build + SPA fallback
```

<!-- preflight -->