-- Phase 2 full Settings module: markets/deal_types/lead_sources have been
-- company-scoped lookups since Phase 0 (seeded with defaults at signup) but
-- only had a select policy -- editable via the Supabase table editor only,
-- per CLAUDE.md. Adding a Settings UI for them needs an insert policy too,
-- same shape as on_hold_reasons/checklist_items: any member can add one, not
-- admin-gated at the RLS layer (the Settings *page* is still admin-only).
create policy "Members can create markets for their company"
  on markets for insert with check (is_company_member(company_id));
create policy "Members can create deal types for their company"
  on deal_types for insert with check (is_company_member(company_id));
create policy "Members can create lead sources for their company"
  on lead_sources for insert with check (is_company_member(company_id));
