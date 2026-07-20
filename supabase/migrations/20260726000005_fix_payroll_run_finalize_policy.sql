-- Bug fix: the draft-only update policy from 20260726000004 had no explicit
-- WITH CHECK, so Postgres reused its USING clause (status = 'draft') for
-- the new row too -- meaning the finalize update (setting status =
-- 'finalized') satisfied USING (old row was draft) but failed the implicit
-- WITH CHECK (new row isn't draft), so it silently updated zero rows.
-- USING still gates which rows can be touched (must currently be draft);
-- WITH CHECK only requires can_manage_team on the resulting row, so the
-- transition to 'finalized' is allowed.
drop policy "Managers can update draft payroll runs for their company" on payroll_runs;
create policy "Managers can update draft payroll runs for their company"
  on payroll_runs for update
  using (can_manage_team(company_id) and status = 'draft')
  with check (can_manage_team(company_id));
