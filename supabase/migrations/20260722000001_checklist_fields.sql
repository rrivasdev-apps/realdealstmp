-- The Deal Checklist -- see docs/data-model.md's checklist_items note and
-- Rafael's spec: each item is a checkbox that, for some items, reveals an
-- associated value field when checked. The known ~14 items get explicit
-- typed columns here (same pattern as every other deal boolean --
-- title_opened, buyer_found, is_jv_deal, etc.), not a generic table.
-- Company-added custom items are a separate, genuinely generic pair
-- (checklist_items/deal_checklist_items, see the next migration) since
-- they're boolean-only with no item-specific fields to predefine.
--
-- Renegotiation AB, Renegotiation BC, and BC EMD Deposit are deliberately
-- NOT new columns here -- per Rafael, they reuse contract_price/
-- contract_price_renegotiated_date, renegotiated_bc_price/renegotiated_bc_date,
-- and buyer_deposit_received/buyer_deposit_amount respectively (all already
-- exist). AB EMD Deposit has no BC-side equivalent yet, so it's new,
-- mirroring the BC shape.
alter table deals
  -- Plain checkboxes, no revealed fields.
  add column checklist_post_occupancy bool not null default false,
  add column checklist_survey_needed bool not null default false,
  add column checklist_initial_photos_needed bool not null default false,
  add column checklist_seller_info_sheet_needed bool not null default false,
  add column checklist_memo bool not null default false,
  add column checklist_on_hold bool not null default false,
  add column checklist_closing_extension bool not null default false,
  add column checklist_due_diligence_extension bool not null default false,

  -- AB EMD Deposit -- new, mirrors buyer_deposit_received/buyer_deposit_amount.
  add column ab_emd_deposit_received bool not null default false,
  add column ab_emd_amount numeric,

  -- Cancelled-AB / Cancelled-BC-AC -- independent flags (not tied to
  -- status_id, per Rafael), each with a date + reason when checked.
  add column cancelled_ab bool not null default false,
  add column cancelled_ab_date date,
  add column cancelled_ab_reason text,
  add column cancelled_bc_ac bool not null default false,
  add column cancelled_bc_ac_date date,
  add column cancelled_bc_ac_reason text;
