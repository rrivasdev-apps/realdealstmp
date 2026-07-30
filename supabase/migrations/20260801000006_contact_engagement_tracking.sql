-- Phase 2.5 (Contact Hub): the far-right engagement-tracking column from
-- docs/reference/contact-hub.md's 3-column detail view -- Created By /
-- Last Updated / Last Contacted, separate from the main record fields.

alter table contacts
  add column created_by uuid references profiles (id),
  add column updated_at timestamptz not null default now(),
  add column last_contacted_at timestamptz;
