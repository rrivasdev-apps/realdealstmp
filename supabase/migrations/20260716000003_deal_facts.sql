-- Fills gaps against the original app's Deal Info tab (Property Facts,
-- Deal Facts / Title Information, Mortgage/Payoff) surfaced from real
-- screenshots -- see docs/data-model.md's deals entity breakdown. None of
-- these are behind a conditional the way BC contract fields are; the
-- original screens show them as plain always-visible fields.

-- 'Title Company' is a contact type seen in the original screens
-- (docs/data-model.md's contact_types listing) that the Phase 0 seed list
-- omitted -- add it now so title_company_contact_id has something to
-- filter by, same pattern as the existing Mortgage Company/Seller types.
insert into contact_types (name) values ('Title Company');

alter table deals
  -- Property facts
  add column apn text,
  add column legal_description text,
  add column lot_size_acres numeric,

  -- AB-Purchase Type -- shares the purchase_types lookup with offers
  add column ab_purchase_type_id uuid references purchase_types (id),

  -- Title information
  add column title_opened bool not null default false,
  add column title_ordered bool not null default false,
  add column title_ready bool not null default false,
  add column poa_needed bool not null default false,
  add column title_company_contact_id uuid references contacts (id),

  -- Mortgage / payoff
  add column mortgage_company_contact_id uuid references contacts (id),
  add column payoff_ordered bool not null default false,
  add column mortgage_principal_balance numeric,
  add column mortgage_rate numeric,
  add column mortgage_term numeric,
  add column in_foreclosure bool not null default false,
  add column foreclosure_date date,
  add column total_payoff_amount numeric,

  -- Seller + listing status
  add column seller_contact_id uuid references contacts (id),
  add column is_listed bool not null default false;
