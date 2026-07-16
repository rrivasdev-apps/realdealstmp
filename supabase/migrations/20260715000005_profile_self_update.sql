-- Lets a user update their own profile (currently just `name`, via
-- /api/profile) without being able to grant themselves a different role or
-- move themselves to a different company.
create function protect_profile_role_and_company()
returns trigger
language plpgsql
as $$
begin
  new.company_id := old.company_id;
  new.role := old.role;
  return new;
end;
$$;

create trigger protect_profile_role_and_company_trigger
  before update on profiles
  for each row execute function protect_profile_role_and_company();

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
