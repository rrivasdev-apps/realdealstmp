-- Structured address components alongside the existing free-text `address` column, so
-- Google Places autocomplete (src/components/address-fields.tsx) can decompose a typed
-- address the same way the original app did. `address` keeps its current meaning/usage
-- everywhere else in the app (Whiteboard rows, KPI, search, automations, etc.) untouched --
-- these are purely additive, always-manually-editable fields, never a hard dependency on
-- Google's service being configured or covering a given location.
alter table deals
  add column city text,
  add column state text,
  add column zip_code text;
