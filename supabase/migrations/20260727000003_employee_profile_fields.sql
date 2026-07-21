-- Employee Center, piece 4c: the "Additional employee info" fields from
-- Rafael's reference screenshots (employee type, hire/birth date, address,
-- payment mechanism, automatic-emails toggle). All nullable/optional --
-- employee_type is called out as required in the reference, but making it
-- NOT NULL here would break every existing profile that has no value yet;
-- enforce "required" in the form instead, same as the rest of this app's
-- convention of not adding DB constraints for things that can't apply to
-- pre-existing rows.
alter table profiles
  add column employee_type text check (employee_type in ('full_time', 'part_time', 'contractor')),
  add column hire_date date,
  add column birth_date date,
  add column address text,
  add column paid_via text,
  add column automatic_emails boolean not null default false;
