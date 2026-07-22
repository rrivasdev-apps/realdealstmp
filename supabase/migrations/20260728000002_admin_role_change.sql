-- protect_profile_role_and_company_trigger (see
-- 20260715000005_profile_self_update.sql) unconditionally reverts `role`/
-- `company_id` on every profiles UPDATE, including ones issued by the
-- service-role admin client from /api/team/[id]/role -- so an admin could
-- never actually promote/demote a teammate. Narrow the guard to only fire
-- when the row owner is updating their own profile (the self-update RLS
-- policy path, e.g. /api/profile); service-role writes have no auth.uid()
-- and go through routes that already gate this with requireAdmin().
create or replace function protect_profile_role_and_company()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id then
    new.company_id := old.company_id;
    new.role := old.role;
  end if;
  return new;
end;
$$;
