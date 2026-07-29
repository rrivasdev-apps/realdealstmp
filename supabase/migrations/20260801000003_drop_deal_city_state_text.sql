-- deals.city/deals.state (free text, added in 20260801000001_deal_address_components.sql)
-- have been fully superseded by the country_id/state_id/city_id FK columns added in
-- 20260801000002_deal_geography.sql. All existing companies were seeded with a full
-- geography and every deal's city/state text was resolved into the new FK columns by
-- a one-time backfill script before this migration ran -- see the deal-geography plan.
-- zip_code is untouched: it stays free text, not part of this hierarchy.
alter table deals
  drop column city,
  drop column state;
