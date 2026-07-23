-- Transaction Guardian / Deal Automations, Milestone 2 Phase 2A: the runtime engine's
-- schema. Nothing in Milestone 1 (automation_templates/automation_template_steps) ran
-- against deals -- these tables are the actual per-deal instances. See
-- docs/reference/transaction-guardian.md for the full spec.

create table automation_processes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references automation_templates (id) on delete cascade,
  deal_id uuid not null references deals (id) on delete cascade,
  status text not null default 'pending_start' check (status in ('pending_start', 'running', 'completed')),
  started_manually boolean not null default false,
  triggered_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index automation_processes_deal_id_idx on automation_processes (deal_id);
create index automation_processes_template_id_idx on automation_processes (template_id);

-- Backs "a template can't have two simultaneously-active processes on the same deal" --
-- startProcess catches the unique violation and returns the existing process instead of
-- erroring, so a bouncing field_changed trigger (or a re-fired deal_created path) can't
-- spawn duplicates. Different templates can still run concurrently on the same deal.
create unique index automation_processes_active_template_deal_idx
  on automation_processes (template_id, deal_id) where status <> 'completed';

-- Lazily created: only the current step of a running process exists as a row (see
-- docs/reference/transaction-guardian.md's runtime section for why -- pre-creating a
-- whole chain up front doesn't survive branching). template_step_id is ON DELETE RESTRICT,
-- not CASCADE: a template step referenced by real run history shouldn't be deletable out
-- from under it.
create table automation_steps (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references automation_processes (id) on delete cascade,
  template_step_id uuid not null references automation_template_steps (id) on delete restrict,
  status text not null default 'due' check (status in ('due', 'completed')),
  due_at date not null,
  completed_at timestamptz,
  completed_by_profile_id uuid references profiles (id) on delete set null,
  selected_option_key text,
  field_updates jsonb,
  created_at timestamptz not null default now()
);

create index automation_steps_process_id_idx on automation_steps (process_id);
create index automation_steps_due_idx on automation_steps (status, due_at);

-- Multiple-choice option_list selections -- existence = selected, same pattern as
-- deal_checklist_items/contact_contact_types.
create table automation_step_options (
  automation_step_id uuid not null references automation_steps (id) on delete cascade,
  option_key text not null,
  primary key (automation_step_id, option_key)
);

create table automation_activity_log (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references automation_processes (id) on delete cascade,
  event_type text not null,
  detail jsonb,
  actor_profile_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index automation_activity_log_process_id_idx on automation_activity_log (process_id);

-- RLS: read/write = company membership via the deal. Runtime actions (completing a step,
-- starting a process) are deal-editing actions, not Settings-editing ones -- the stricter
-- can_manage_settings gate belongs to the template tables only. edit_deal_detail is
-- enforced in the route handlers, per this project's "RLS is defense in depth, not the
-- authorization decision" rule -- same shape as deal_employees/payments.

alter table automation_processes enable row level security;

create policy "Members can read their company's automation processes"
  on automation_processes for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can create automation processes for their company's deals"
  on automation_processes for insert with check (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can update automation processes for their company's deals"
  on automation_processes for update using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );

alter table automation_steps enable row level security;

create policy "Members can read their company's automation steps"
  on automation_steps for select using (
    exists (select 1 from automation_processes p
      join deals on deals.id = p.deal_id
      where p.id = process_id and is_company_member(deals.company_id))
  );
create policy "Members can create automation steps for their company's deals"
  on automation_steps for insert with check (
    exists (select 1 from automation_processes p
      join deals on deals.id = p.deal_id
      where p.id = process_id and is_company_member(deals.company_id))
  );
create policy "Members can update automation steps for their company's deals"
  on automation_steps for update using (
    exists (select 1 from automation_processes p
      join deals on deals.id = p.deal_id
      where p.id = process_id and is_company_member(deals.company_id))
  );

alter table automation_step_options enable row level security;

create policy "Members can read their company's automation step options"
  on automation_step_options for select using (
    exists (select 1 from automation_steps s
      join automation_processes p on p.id = s.process_id
      join deals on deals.id = p.deal_id
      where s.id = automation_step_id and is_company_member(deals.company_id))
  );
create policy "Members can create automation step options for their company's deals"
  on automation_step_options for insert with check (
    exists (select 1 from automation_steps s
      join automation_processes p on p.id = s.process_id
      join deals on deals.id = p.deal_id
      where s.id = automation_step_id and is_company_member(deals.company_id))
  );

alter table automation_activity_log enable row level security;

create policy "Members can read their company's automation activity log"
  on automation_activity_log for select using (
    exists (select 1 from automation_processes p
      join deals on deals.id = p.deal_id
      where p.id = process_id and is_company_member(deals.company_id))
  );
create policy "Members can create automation activity log entries for their company's deals"
  on automation_activity_log for insert with check (
    exists (select 1 from automation_processes p
      join deals on deals.id = p.deal_id
      where p.id = process_id and is_company_member(deals.company_id))
  );
