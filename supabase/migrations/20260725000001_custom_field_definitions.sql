-- Phase 2 per-company custom fields: Settings UI for defining fields that
-- get stored in the custom_fields JSONB column on deals (that column has
-- existed since Phase 0 for exactly this, see CLAUDE.md). Definitions are
-- keyed by their own id in the JSONB blob -- renaming a definition's name
-- later doesn't orphan stored values the way a slug-derived key would.
-- Same RLS shape as checklist_items/markets: any member can define one, not
-- admin-gated at the RLS layer (the Settings page itself is admin-only).
create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  field_type text not null check (field_type in ('text', 'number', 'date', 'checkbox', 'select')),
  options text[],
  created_at timestamptz not null default now(),
  constraint select_requires_options check (
    field_type <> 'select' or (options is not null and array_length(options, 1) > 0)
  )
);

create index custom_field_definitions_company_id_idx on custom_field_definitions (company_id);

alter table custom_field_definitions enable row level security;

create policy "Members can read their company's custom field definitions"
  on custom_field_definitions for select using (is_company_member(company_id));
create policy "Members can create custom field definitions for their company"
  on custom_field_definitions for insert with check (is_company_member(company_id));
