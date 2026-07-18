-- Corrects several checklist items that turned out to have real fields
-- behind them (confirmed against a screenshot of the original app's
-- checklist with every item checked) -- the previous migration guessed
-- these were plain booleans. cancelled_ab_reason/cancelled_bc_ac_reason are
-- replaced by proper multi-select reason lists (see next migration); no
-- deal data exists yet to migrate off the free-text version.
alter table deals
  drop column cancelled_ab_reason,
  drop column cancelled_bc_ac_reason,

  -- Post Occupancy
  add column post_occupancy_hold_back_amount numeric,
  add column post_occupancy_move_out_date date,

  -- Survey Needed
  add column survey_ordered_date date,

  -- Initial Photos Needed
  add column initial_photos_ordered_date date,
  add column initial_photos_received_date date,

  -- Closing Extension / Due Diligence Extension -- distinct from
  -- closing_date/due_diligence_expiration themselves; those are the
  -- deal's current dates, these record when an extension was granted.
  add column closing_extension_date date,
  add column due_diligence_extension_date date,

  -- EMD refund tracking, symmetric on both sides now.
  add column ab_emd_refund bool not null default false,
  add column bc_emd_refund bool not null default false,

  -- Seller Info Sheet Needed
  add column seller_info_sheet_sent bool not null default false,
  add column seller_info_sheet_signed bool not null default false,

  -- On Hold
  add column on_hold_date date,

  -- Cancelled-AB / Cancelled-BC-AC party -- fixed small set of roles, not
  -- company-configurable and not a contact reference.
  add column cancelled_ab_party text check (cancelled_ab_party in ('seller', 'buyer', 'us')),
  add column cancelled_bc_ac_party text check (cancelled_bc_ac_party in ('seller', 'buyer', 'us'));
