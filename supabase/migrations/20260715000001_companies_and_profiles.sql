-- Tenant boundary (companies) and per-user profile (role + company membership).
-- One trigger on auth.users backs both the company-signup path and the
-- invite path: both set company_id/role/name in user_metadata before the
-- auth.users row is created, so this single function handles both.

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create index profiles_company_id_idx on profiles (company_id);

-- Central helper every company-scoped table's RLS policies call, instead of
-- repeating this subquery on every table.
create function is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and company_id = target_company_id
  );
$$;

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, company_id, name, email, role)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'company_id')::uuid,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table companies enable row level security;
alter table profiles enable row level security;

-- No insert policy: companies are only created by the service-role signup
-- route, never directly by a client.
create policy "Members can view their own company"
  on companies for select
  using (is_company_member(id));

-- No insert/update/delete policy: profile rows are only written by the
-- handle_new_user trigger (security definer, bypasses RLS).
create policy "Members can view profiles in their company"
  on profiles for select
  using (is_company_member(company_id));
