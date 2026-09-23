# HR Pilot (Supabase)

- Vite + React 19 SPA with React Router; there is no app server. The browser calls Supabase
  directly with supabase-js (`src/lib/supabase.ts`).
- Security lives in Postgres, not in the client: RLS policies, table grants, triggers and the
  `decide_*` RPCs in `supabase/migrations/`. Any new table needs RLS enabled and policies; any
  rule an employee must not bypass goes in SQL, never only in React.
- Schema changes: add a new migration (`supabase migration new <name>`), run `supabase db reset`,
  then `bun run db:types` to regenerate `src/lib/database.types.ts`. Seed data is `supabase/seed.sql`.
- Checks: `bun run build`, `bun run lint`, and `bun run check:rls` against the local stack.
- Package manager is bun. UI primitives in `src/components/ui` are shadcn (Base UI); keep to
  DESIGN.md.
