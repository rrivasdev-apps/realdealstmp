-- Contact Hub "Cities Interested In" (Investor Criteria/Preferences) searches
-- cities by name across the whole company, not scoped to one state the way
-- the deal-form address picker does -- add a prefix index without the
-- state_id column so that search stays index-backed.
create index cities_company_name_prefix_idx on cities (company_id, name text_pattern_ops);
