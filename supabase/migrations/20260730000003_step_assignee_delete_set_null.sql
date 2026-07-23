-- assigned_role_id/assigned_profile_id had no ON DELETE behavior, so deleting
-- an employee_role or profile that's assigned to a step would hit a raw FK
-- violation instead of gracefully clearing the assignment -- which is exactly
-- what the already-relaxed step_assignee_shape constraint (see
-- 20260730000002) is designed to tolerate (a step can have no assignee while
-- mid-configuration, now also while its former assignee no longer exists).
alter table automation_template_steps
  drop constraint automation_template_steps_assigned_role_id_fkey,
  add constraint automation_template_steps_assigned_role_id_fkey
    foreign key (assigned_role_id) references employee_roles (id) on delete set null;

alter table automation_template_steps
  drop constraint automation_template_steps_assigned_profile_id_fkey,
  add constraint automation_template_steps_assigned_profile_id_fkey
    foreign key (assigned_profile_id) references profiles (id) on delete set null;
