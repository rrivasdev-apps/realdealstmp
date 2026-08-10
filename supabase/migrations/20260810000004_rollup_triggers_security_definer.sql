-- The last piece of the "can't delete an employee/company with history" bug.
-- With 20260810000002/3 in place, deleting a profile sets payments.profile_id
-- null, which fires sync_deal_total_commissions -- and that function, being
-- SECURITY INVOKER, runs `update deals` as whatever role triggered it.
-- Supabase's auth admin (supabase_auth_admin, the role behind
-- auth.admin.deleteUser and therefore behind auth.users -> profiles cascades)
-- has no privileges on public.deals, so the delete died with a bare 500.
-- Isolated by attaching one kind of child row at a time to a throwaway
-- employee: only the commission-payment case failed, and only because of the
-- deals update -- a payroll payment (deal_id null, function returns early)
-- deleted fine.
--
-- Both rollups get the same treatment: they maintain a system invariant, so
-- they should run with the definer's rights rather than depending on who
-- happened to touch the underlying row.
--
-- Safe against cross-tenant writes: a caller can't attach a payment or an
-- expense to another company's deal in the first place (payments' insert
-- policy checks `deals.company_id = payments.company_id`, deal_expenses' is
-- scoped through the parent deal), so the deal being recomputed is always one
-- the writer already had access to. The payments rollup additionally pins the
-- update to the payment's own company_id, so it stays self-guarding even if
-- those policies are ever loosened. search_path is pinned empty and every
-- name schema-qualified, the standard precaution for a definer function.

create or replace function sync_deal_total_commissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_deal_id uuid := coalesce(new.deal_id, old.deal_id);
  target_company_id uuid := coalesce(new.company_id, old.company_id);
begin
  if target_deal_id is null then
    return null;
  end if;

  update public.deals
  set total_commissions = (
    select coalesce(sum(amount), 0)
    from public.payments
    where deal_id = target_deal_id and type = 'commission'
  )
  where id = target_deal_id and company_id = target_company_id;
  return null;
end;
$$;

create or replace function sync_deal_total_expenses()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_deal_id uuid := coalesce(new.deal_id, old.deal_id);
begin
  update public.deals
  set total_expenses = (
    select coalesce(sum(amount), 0) from public.deal_expenses where deal_id = target_deal_id
  )
  where id = target_deal_id;
  return null;
end;
$$;
