-- Two-level folder system for Settings > Automations (main folders + subfolders), so
-- companies with many templates can file and find them instead of scrolling one long list.
-- Depth is capped at 2 levels at the app layer (no re-parenting after creation --
-- see src/app/api/automation-folders/route.ts), same convention as buildTriggerFields
-- mirroring automation_templates_trigger_shape in TS rather than a DB trigger.

create table automation_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  parent_folder_id uuid references automation_folders (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index automation_folders_company_id_idx on automation_folders (company_id);
create index automation_folders_parent_folder_id_idx on automation_folders (parent_folder_id);

alter table automation_templates
  add column folder_id uuid references automation_folders (id) on delete set null;

create index automation_templates_folder_id_idx on automation_templates (folder_id);

alter table automation_folders enable row level security;

create policy "Members can read their company's automation folders"
  on automation_folders for select using (is_company_member(company_id));
create policy "Settings managers can create automation folders for their company"
  on automation_folders for insert with check (can_manage_settings(company_id));
create policy "Settings managers can update their company's automation folders"
  on automation_folders for update using (can_manage_settings(company_id));
create policy "Settings managers can delete their company's automation folders"
  on automation_folders for delete using (can_manage_settings(company_id));
