-- step_assignee_shape originally required an assignee the instant step_type
-- became non-null, but the builder's real flow is: pick a type (one PATCH,
-- no assignee yet), then configure assignee/config/next-step in that type's
-- modal (a second PATCH). That's a legitimate mid-configuration state, not a
-- data integrity problem -- src/lib/automations/functional-status.ts's
-- computeStepOperational already treats "no assignee yet" as not-operational
-- at the app layer. The only thing that actually needs a hard DB guard is
-- never allowing *both* a role and a specific profile at once.
alter table automation_template_steps drop constraint step_assignee_shape;

alter table automation_template_steps add constraint step_assignee_shape check (
  not (assigned_role_id is not null and assigned_profile_id is not null)
);
