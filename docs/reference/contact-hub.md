# Contact Hub — reference from the original app

Source: Rafael's voice-transcribed walkthrough ("Contact Hub Explained.pdf") plus
reference screenshots. **The screenshots are visual reference for the old app only** —
RealDeals' actual UI should be modern and well-designed (Claude acting as UX/UI expert),
not a copy of the old look. Only the functional structure below carries over.

## List / home page

- Badges across the top, one per contact type, each showing the count of contacts of that
  type. Clicking a badge filters the list to that type.
- A separate filter control for filtering by name, type, phone, or email.
- Gap vs. today: the current `/contacts` page is a plain list with no counts/badges/filter
  UI — worth closing when Contact Hub gets its next real pass.

## Contact detail / edit view

Header row: Name, three phone number fields (type + number each), three email fields
(type + email each), plus read-only Created By / Created On.

Below that, a **3-column layout** keyed off which contact type is selected:

1. **Left column** — one colored button per contact type this contact currently has
   (Investor, Lender, Mortgage Company, Realtor, Title Company, etc. — each type has a
   distinct color). The selected type gets a highlighted border. A bottom button
   ("Add/Edit Contact Types") adds another type to the contact, which then adds its own
   button/color here and reveals its type-specific configuration.
2. **Second column** — sub-navigation specific to whichever type is selected in column 1.
   Selected option gets a gray background. Known sub-sections per type:
   - **Investor**: Criteria/Preferences, LLC Details, Offers
   - **Realtor**: Brokerage, Realtor, Listings, Areas of Coverage, Offers
   - Other types (Lender, Mortgage Company, Title Company) presumably have their own
     analogous sub-sections — not shown in the supplied screenshots, ask when that
     section's doc arrives.
3. **Third column** — the detail/form content for whichever second-column item is
   selected:
   - **Criteria/Preferences** (Investor): Type of Investor (multi-select tags, e.g.
     Wholesaler / Landlord / Flipper / JV Partner / Funder), Communication Preferences,
     Markets/Cities/Zip Codes Interested In (each: select from an existing
     company-scoped list + "Add new" button), Type of Deals Interested In, Type of
     Properties Interested In.
   - **LLC Details** (Investor) / **Brokerage** (Realtor): list of linked LLCs (name +
     address, with an ✕ to unlink) plus two buttons — **Add LLC** (create new) and
     **Link to LLC** (attach an existing one already in the system). LLCs are not
     investor-only — a realtor's brokerage is also an LLC-type entity, linked the same
     way.
     - ⚠️ This generalizes the `investor_llcs` work: contacts need an Add-or-Link flow to
       LLC-type entities, and the relationship needs a *role* (investor LLC vs. brokerage
       LLC), not a single `investor_llc_id` column.
   - **Realtor** (Realtor's own sub-tab, distinct from "Brokerage"): Select Industry(s) —
     Commercial / Residential / Industrial; Select Asset Type(s) — Single Family
     Residence, Multiple Family Residence, Mobile, Office, Mobile Home Park, Storage,
     Warehouse, Retail, Flex, Land, Land Development, Agriculture; Select Specialty(s) —
     REO, Shortsale, Creative, Seller Finance, SubTo, Novation, Wholesale. All
     multi-select.
   - **Listings** (Realtor): listings tied to this realtor, with an "Add Listing" button.
   - **Areas of Coverage** (Realtor): States Serving, Markets Serving, Cities Serving, Zip
     Codes Serving — each a select-from-list + "Add [X]" button for a new option.
   - **Offers**: all offers this person/company has made on deals — scoped to the current
     company/tenant, never cross-tenant.
4. **Far-right column** — Notes (free text), Last Updated (timestamp), Last Contacted
   (with an "Update to Today" button) — engagement tracking, separate from the main
   record.

## Notable modeling implications

- LLCs (investor LLCs and realtor brokerages) are a shared concept, linked to contacts via
  Add-or-Link with a role — needs a join table (contact ↔ LLC ↔ role), not a single FK
  column on `contacts`.
- Type-specific criteria/preferences (markets/cities/zip codes interested in, specialties,
  asset types, industries) are per-contact-type option sets, several multi-select and
  company-configurable ("add new" inline) — a meaningfully bigger data model than Phase
  0's flat `contacts` table.
- This whole Contact Hub buildout is a significant step up from the current Phase 0
  implementation and should probably be scoped as its own milestone.
