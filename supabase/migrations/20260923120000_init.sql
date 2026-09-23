-- HR Pilot on Supabase: schema, row level security and the rules the browser cannot bypass.
--
-- The browser talks to PostgREST directly with the anon key + the signed-in user's JWT, so every
-- rule that matters for security lives here:
--   * RLS decides which rows a user can see or insert.
--   * Table privileges decide which statements a user may run at all (no UPDATE/DELETE on requests).
--   * Triggers normalise inserted rows (status, decided_by, days) and guard profile columns.
--   * security definer RPCs perform the admin-only approve/reject decisions.

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------

create type public.user_role as enum ('ADMIN', 'EMPLOYEE');
create type public.leave_type as enum ('ANNUAL', 'SICK', 'UNPAID');
create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type public.claim_category as enum ('FOOD', 'TRAVEL', 'MEDICAL', 'OTHER');

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- One row per auth user. Sign-in identity (email + password) lives in auth.users; `email` here is
-- the contact address shown in the app and editable from Settings.
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  name              text not null check (char_length(btrim(name)) between 2 and 100),
  email             text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  username          text not null unique check (username = lower(username)),
  role              public.user_role not null default 'EMPLOYEE',
  job_title         text not null,
  department        text not null,
  date_joined       date not null,
  annual_leave_days integer not null default 14 check (annual_leave_days >= 0),
  sick_leave_days   integer not null default 14 check (sick_leave_days >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.leave_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type          public.leave_type not null,
  start_date    date not null,
  end_date      date not null,
  days          numeric(5, 1) not null default 0, -- computed by prepare_leave_request()
  reason        text not null check (char_length(btrim(reason)) between 3 and 500),
  status        public.request_status not null default 'PENDING',
  decided_by_id uuid references public.profiles (id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint leave_requests_dates_check check (end_date >= start_date)
);
create index leave_requests_user_id_idx on public.leave_requests (user_id);

create table public.claims (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category      public.claim_category not null,
  amount        numeric(12, 2) not null check (amount > 0 and amount <= 100000),
  description   text not null check (char_length(btrim(description)) between 3 and 500),
  date          date not null,
  status        public.request_status not null default 'PENDING',
  decided_by_id uuid references public.profiles (id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index claims_user_id_idx on public.claims (user_id);

create table public.payslips (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  month        text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  basic_salary numeric(12, 2) not null,
  allowances   numeric(12, 2) not null,
  deductions   numeric(12, 2) not null,
  net_pay      numeric(12, 2) not null,
  generated_at timestamptz not null default now(),
  unique (user_id, month)
);
create index payslips_user_id_idx on public.payslips (user_id);

-- ---------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------

-- security definer so policies on profiles can call it without recursing into profiles' own RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'ADMIN'
  );
$$;

-- True when the statement comes from an API user (PostgREST switches to these roles) rather than
-- from the postgres/service role (migrations, seed, dashboard SQL editor).
create function public.is_api_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Triggers: rules that plain policies cannot express
-- ---------------------------------------------------------------------------------------------

-- Employees may edit only their own name and contact email. HR fields (role, username, job title,
-- department, join date, leave entitlements) are admin-only, so nobody can promote themselves.
create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_user() and not public.is_admin() then
    if new.id is distinct from old.id
      or new.username is distinct from old.username
      or new.role is distinct from old.role
      or new.job_title is distinct from old.job_title
      or new.department is distinct from old.department
      or new.date_joined is distinct from old.date_joined
      or new.annual_leave_days is distinct from old.annual_leave_days
      or new.sick_leave_days is distinct from old.sick_leave_days
      or new.created_at is distinct from old.created_at then
      raise exception 'Only HR can change work information.' using errcode = '42501';
    end if;
  end if;
  new.name := btrim(new.name);
  new.email := lower(btrim(new.email));
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profile_update();

-- A new leave request always starts PENDING and undecided, belongs to the caller, and its day
-- count is computed here (inclusive of both ends), whatever the client sent.
create function public.prepare_leave_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_user() then
    new.user_id := auth.uid();
    new.status := 'PENDING';
    new.decided_by_id := null;
    new.decided_at := null;
    new.created_at := now();
  end if;
  if new.end_date < new.start_date then
    raise exception 'End date must be on or after the start date.' using errcode = '22023';
  end if;
  new.reason := btrim(new.reason);
  new.days := (new.end_date - new.start_date) + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger leave_requests_prepare_insert
before insert on public.leave_requests
for each row execute function public.prepare_leave_request();

create function public.prepare_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_api_user() then
    new.user_id := auth.uid();
    new.status := 'PENDING';
    new.decided_by_id := null;
    new.decided_at := null;
    new.created_at := now();
  end if;
  new.description := btrim(new.description);
  new.updated_at := now();
  return new;
end;
$$;

create trigger claims_prepare_insert
before insert on public.claims
for each row execute function public.prepare_claim();

create trigger leave_requests_set_updated_at
before update on public.leave_requests
for each row execute function public.set_updated_at();

create trigger claims_set_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Admin decisions (the old PATCH /api/leaves/:id and /api/claims/:id)
-- ---------------------------------------------------------------------------------------------

create function public.decide_leave_request(request_id uuid, decision public.request_status)
returns public.leave_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.leave_requests;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if decision not in ('APPROVED', 'REJECTED') then
    raise exception 'Invalid status.' using errcode = '22023';
  end if;

  update public.leave_requests
  set status = decision, decided_by_id = auth.uid(), decided_at = now()
  where id = request_id
  returning * into result;

  if not found then
    raise exception 'Leave request not found.' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

create function public.decide_claim(claim_id uuid, decision public.request_status)
returns public.claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.claims;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if decision not in ('APPROVED', 'REJECTED') then
    raise exception 'Invalid status.' using errcode = '22023';
  end if;

  update public.claims
  set status = decision, decided_by_id = auth.uid(), decided_at = now()
  where id = claim_id
  returning * into result;

  if not found then
    raise exception 'Claim not found.' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Privileges: anon gets nothing; signed-in users get only the statements the app needs
-- ---------------------------------------------------------------------------------------------

revoke all on public.profiles, public.leave_requests, public.claims, public.payslips from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert on public.leave_requests to authenticated;
grant select, insert on public.claims to authenticated;
grant select on public.payslips to authenticated;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.decide_leave_request(uuid, public.request_status) from public, anon;
revoke execute on function public.decide_claim(uuid, public.request_status) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.decide_leave_request(uuid, public.request_status) to authenticated;
grant execute on function public.decide_claim(uuid, public.request_status) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;
alter table public.claims enable row level security;
alter table public.payslips enable row level security;

-- profiles: see yourself (admins see everyone); update yourself (the trigger limits the columns),
-- admins may update anyone. No insert/delete from the API: HR provisions accounts.
create policy "Profiles are visible to their owner and admins"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update their own profile, admins update any"
on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

-- leave_requests: read your own (admins read all); insert only for yourself. Status changes go
-- through decide_leave_request(); there is no UPDATE or DELETE privilege at all.
create policy "Leave requests are visible to their owner and admins"
on public.leave_requests for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users apply for leave for themselves"
on public.leave_requests for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'PENDING' and decided_by_id is null);

-- claims: same shape as leave requests.
create policy "Claims are visible to their owner and admins"
on public.claims for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users submit claims for themselves"
on public.claims for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'PENDING' and decided_by_id is null);

-- payslips: read-only; your own, or everyone's for admins.
create policy "Payslips are visible to their owner and admins"
on public.payslips for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
