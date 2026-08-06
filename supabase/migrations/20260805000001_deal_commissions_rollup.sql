-- deals.total_commissions was kept as a flat manually-entered figure in
-- 20260720000001_deal_expenses_commissions.sql, matching the legacy app's
-- "Total Commissions" field -- but the commission engine
-- (commission_types/deal_employees/payments, src/lib/deals/commissions.ts)
-- shipped afterward as a separate track and never got wired to update it.
-- Result: the Employees section (live payments rows) and the Financial
-- section (this stale manual number) permanently disagreed. Same fix
-- already applied to total_expenses in 20260801000014_deal_expenses.sql --
-- turn it into a generated rollup of the real data instead.
create or replace function sync_deal_total_commissions()
returns trigger
language plpgsql
as $$
declare
  target_deal_id uuid := coalesce(new.deal_id, old.deal_id);
begin
  if target_deal_id is null then
    return null;
  end if;

  update deals
  set total_commissions = (
    select coalesce(sum(amount), 0) from payments where deal_id = target_deal_id and type = 'commission'
  )
  where id = target_deal_id;
  return null;
end;
$$;

create trigger payments_sync_deal_total_commissions
  after insert or update or delete on payments
  for each row execute function sync_deal_total_commissions();

-- Backfill existing deals so this isn't a breaking change for data that
-- already has commission payments recorded.
update deals
set total_commissions = (
  select coalesce(sum(amount), 0) from payments where payments.deal_id = deals.id and payments.type = 'commission'
)
where exists (select 1 from payments where payments.deal_id = deals.id and payments.type = 'commission');
