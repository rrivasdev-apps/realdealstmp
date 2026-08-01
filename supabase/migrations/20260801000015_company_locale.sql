-- App-wide language, chosen once at signup alongside the home country (see
-- /api/signup) -- a workspace-level setting like default_country_id, not a
-- per-user preference: everyone in the company sees the app in the same
-- language. 'en' default; 'es' is the only other option for now.
alter table companies
  add column locale text not null default 'en' check (locale in ('en', 'es'));
