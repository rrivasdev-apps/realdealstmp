-- Transaction Guardian / Deal Automations, Milestone 1: template/step schema only.
-- Nothing runs yet (no automation_processes/automation_steps -- that's Milestone 2).
-- See docs/reference/transaction-guardian.md for the full spec this schema follows.

create table automation_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in
    ('deal_created', 'field_changed', 'custom_field_changed', 'step_completed', 'date_based')),
  trigger_deal_type_id uuid references deal_types (id) on delete set null,
  trigger_deal_field text,
  trigger_custom_field_id uuid references custom_field_definitions (id) on delete cascade,
  trigger_source_step_id uuid,
  trigger_date_field text,
  trigger_date_direction text check (trigger_date_direction in ('on', 'before', 'after')),
  trigger_date_offset_days int,
  start_delay_days int not null default 0,
  first_step_due_delay_days int not null default 0,
  is_functional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index automation_templates_company_id_idx on automation_templates (company_id);

-- Only the columns relevant to this trigger_type may be populated -- same convention as
-- commission_types_basis_required_for_percentage / select_requires_options.
alter table automation_templates add constraint automation_templates_trigger_shape check (
  (trigger_type = 'deal_created' and trigger_deal_field is null and trigger_custom_field_id is null
    and trigger_source_step_id is null and trigger_date_field is null and trigger_date_direction is null) or
  (trigger_type = 'field_changed' and trigger_deal_field is not null and trigger_custom_field_id is null
    and trigger_source_step_id is null and trigger_date_field is null) or
  (trigger_type = 'custom_field_changed' and trigger_custom_field_id is not null and trigger_deal_field is null
    and trigger_source_step_id is null and trigger_date_field is null) or
  (trigger_type = 'step_completed' and trigger_source_step_id is not null and trigger_deal_field is null
    and trigger_custom_field_id is null and trigger_date_field is null) or
  (trigger_type = 'date_based' and trigger_date_field is not null and trigger_date_direction is not null
    and trigger_deal_field is null and trigger_custom_field_id is null and trigger_source_step_id is null)
);

-- step_type is nullable: a step exists as an empty "Drop Action Here" placeholder until a
-- type is dropped on it. next_step_id/completes_automator (the shared "next step" behavior)
-- are only meaningful for non-branching step types and multi-choice option_list -- the two
-- branching cases (conditional_statement, single-choice option_list) store their per-option
-- version of this same shape inside config instead. Single-vs-multiple-choice is a
-- config-level flag, not a step_type value, so that nuance is enforced in application code
-- (src/lib/automations/step-config.ts), not a SQL check.
create table automation_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references automation_templates (id) on delete cascade,
  step_number int not null check (step_number > 0),
  step_type text check (step_type in
    ('fill_fields', 'conditional_statement', 'email_task', 'call_task',
     'generic_task', 'show_text', 'option_list', 'trigger')),
  name text,
  description text,
  config jsonb not null default '{}'::jsonb,
  assigned_role_id uuid references employee_roles (id),
  assigned_profile_id uuid references profiles (id),
  next_step_id uuid references automation_template_steps (id) on delete set null,
  next_step_due_delay_days int,
  completes_automator boolean not null default false,
  is_operational boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint step_assignee_shape check (
    step_type is null or ((assigned_role_id is not null) <> (assigned_profile_id is not null))
  ),
  constraint step_next_step_shape check (next_step_id is null or not completes_automator),
  constraint step_number_unique unique (template_id, step_number) deferrable initially deferred
);

create index automation_template_steps_template_id_idx on automation_template_steps (template_id);

-- Forward reference from automation_templates, added now that the target table exists.
alter table automation_templates
  add constraint automation_templates_trigger_source_step_id_fkey
  foreign key (trigger_source_step_id) references automation_template_steps (id) on delete set null;

-- "Trigger another automation on this step's completion" -- option_key is null for a
-- step-level trigger, or set to the specific branch/option that fired it
-- ('option_1'/'option_2' for conditional_statement, 'option_1'..'option_10' for option_list).
create table automation_template_step_triggers (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references automation_template_steps (id) on delete cascade,
  option_key text,
  target_template_id uuid not null references automation_templates (id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (step_id, option_key, target_template_id)
);

alter table automation_templates enable row level security;

create policy "Members can read their company's automation templates"
  on automation_templates for select using (is_company_member(company_id));
create policy "Settings managers can create automation templates for their company"
  on automation_templates for insert with check (can_manage_settings(company_id));
create policy "Settings managers can update their company's automation templates"
  on automation_templates for update using (can_manage_settings(company_id));
create policy "Settings managers can delete their company's automation templates"
  on automation_templates for delete using (can_manage_settings(company_id));

alter table automation_template_steps enable row level security;

create policy "Members can read their company's automation template steps"
  on automation_template_steps for select using (
    exists (select 1 from automation_templates
      where automation_templates.id = template_id and is_company_member(automation_templates.company_id))
  );
create policy "Settings managers can create automation template steps for their company"
  on automation_template_steps for insert with check (
    exists (select 1 from automation_templates
      where automation_templates.id = template_id and can_manage_settings(automation_templates.company_id))
    and (assigned_role_id is null or exists (
      select 1 from employee_roles er join automation_templates t on t.id = template_id
      where er.id = assigned_role_id and er.company_id = t.company_id
    ))
    and (assigned_profile_id is null or exists (
      select 1 from profiles p join automation_templates t on t.id = template_id
      where p.id = assigned_profile_id and p.company_id = t.company_id
    ))
  );
create policy "Settings managers can update their company's automation template steps"
  on automation_template_steps for update using (
    exists (select 1 from automation_templates
      where automation_templates.id = template_id and can_manage_settings(automation_templates.company_id))
  ) with check (
    exists (select 1 from automation_templates
      where automation_templates.id = template_id and can_manage_settings(automation_templates.company_id))
    and (assigned_role_id is null or exists (
      select 1 from employee_roles er join automation_templates t on t.id = template_id
      where er.id = assigned_role_id and er.company_id = t.company_id
    ))
    and (assigned_profile_id is null or exists (
      select 1 from profiles p join automation_templates t on t.id = template_id
      where p.id = assigned_profile_id and p.company_id = t.company_id
    ))
  );
create policy "Settings managers can delete their company's automation template steps"
  on automation_template_steps for delete using (
    exists (select 1 from automation_templates
      where automation_templates.id = template_id and can_manage_settings(automation_templates.company_id))
  );

alter table automation_template_step_triggers enable row level security;

create policy "Members can read their company's automation step triggers"
  on automation_template_step_triggers for select using (
    exists (select 1 from automation_template_steps s
      join automation_templates t on t.id = s.template_id
      where s.id = step_id and is_company_member(t.company_id))
  );
create policy "Settings managers can create automation step triggers for their company"
  on automation_template_step_triggers for insert with check (
    exists (select 1 from automation_template_steps s
      join automation_templates t on t.id = s.template_id
      where s.id = step_id and can_manage_settings(t.company_id))
    and exists (select 1 from automation_template_steps s
      join automation_templates source on source.id = s.template_id
      join automation_templates target on target.id = target_template_id
      where s.id = step_id and target.company_id = source.company_id)
  );
create policy "Settings managers can delete their company's automation step triggers"
  on automation_template_step_triggers for delete using (
    exists (select 1 from automation_template_steps s
      join automation_templates t on t.id = s.template_id
      where s.id = step_id and can_manage_settings(t.company_id))
  );
