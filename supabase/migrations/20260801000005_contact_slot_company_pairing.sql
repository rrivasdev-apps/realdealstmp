-- Phase 2.5 (Contact Hub): extends the contact+company pairing pattern
-- (already shipped for JV partner in 20260801000004) to the other deal/offer
-- contact slots whose contact type has a matching partner_companies
-- company_type -- Title Company, Mortgage Company (deals), Realtor/Brokerage
-- and Investor (offers). Seller/buyer/vendor slots are deliberately excluded:
-- there's no corresponding company_type for them today.

alter table deals
  add column title_company_id uuid references partner_companies (id),
  add column mortgage_company_id uuid references partner_companies (id);

alter table offers
  add column realtor_company_id uuid references partner_companies (id),
  add column investor_company_id uuid references partner_companies (id);
