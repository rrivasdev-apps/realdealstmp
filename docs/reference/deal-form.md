# Deal Form — reference from the original app

Source: Rafael's voice-transcribed walkthrough ("Deal Form Explained.pdf") of how the
Deal page worked in the original app, plus reference screenshots. **The screenshots are
visual reference for the old app only** — RealDeals' actual UI should be modern and
well-designed (Claude acting as UX/UI expert), not a copy of the old look. Only the
functional structure and data flows below carry over. See [data-model.md](../data-model.md)
for the current schema.

## Deal Info tab

- **Address**: Google Places typeahead as the user types; selecting a suggestion fills the
  address and decomposes it into street address, city, state, and zip as separate values —
  not just one free-text string. **Gap vs. current schema**: `deals.address` is a single
  text column today; this needs street/city/state/zip fields to support the lookup and any
  future filtering by market/geography.
- Vendor / Title Company / Investor / Realtor / Seller pickers all pull from Contact Hub
  contacts (see [contact-hub.md](contact-hub.md)). Each is a dropdown of existing contacts
  pre-filtered to the relevant type, with an "Add" affordance to create a new contact
  inline without leaving the deal form (mirrors what we already do for
  title/mortgage/seller contacts, generalized to all pickers).
- **Companies vs. contacts**: the original app has a "company" concept distinct from the
  individual contact — title companies, investor companies, brokerages, vendor companies.
  A company record has its own address/email/website plus a multi-select role field (can
  be investor + realtor at once, same pattern as `contact_contact_types`). A contact
  (person) can be linked to one or more of these companies, with a role at each.
  - ⚠️ **Naming collision**: our `companies` table is the tenant boundary
    ([data-model.md](../data-model.md)). The original app's "company" (title co.,
    brokerage, vendor co.) is a different concept and needs a different name in our
    schema — e.g. `partner_companies`. This generalizes what we just built as
    `investor_llcs` to also cover title companies, brokerages, and vendor companies, each
    linked to a contact + role.
- Several lookup dropdowns (reason for selling, etc.) need an inline "add new option"
  affordance for values not yet in the list — company-configurable, matches the Phase 2
  Settings module already planned in `CLAUDE.md`.
- **Custom fields**: explicitly deferred by Rafael — matches the existing Phase 2 plan,
  no action needed.

## Dispo tab

- Showings, original projected price, projected sales price — showings are still on the
  roadmap, not yet built.
- **JV fields** — mostly matches what we built in the JV milestone, with one gap:
  - Is JV deal? (yes/no, drives visibility of the rest)
  - JV partner — both a **company** (LLC) *and* a **contact (person)** associated with the
    deal. ⚠️ We only wired `jv_partner_company_id`; the reference calls for a JV partner
    *contact* too, not just the company.
  - JV split type (percentage vs. flat amount) drives which single field shows — matches
    what we built.
- Offers, showings, Buyer Found → BC contract details — already built or already scoped.
- Yes/no fields act as show/hide flags for their dependent section, same pattern already
  used for `buyer_found` / `is_jv_deal`.

## Financial tab

Read-only rollup sourced from the other tabs, recalculated as the deal progresses. The
cascade, in order:

1. **Estimated Projected Profit** ("Assigned Revenue") = Selling Price (projected or
   actual) − Contract Price
2. **Estimated Gross Profit** = Estimated Projected Profit (the pre-expense figure)
3. **Estimated Net Profit Before Commissions** = Estimated Gross Profit − Expenses
4. **Estimated Net Profit** = Estimated Net Profit Before Commissions − Commissions

All of these are "estimated" while the deal is open; once Closed, the same rollup should
show as definite/actual numbers instead of estimates — the same original-vs-current
pattern already used elsewhere in the schema. This cascade is the concrete formula chain
for the Phase 1 commission-engine milestone (`src/lib/deals/profit.ts` will need to grow
into this).

## Deal page header / chrome

- Seller name shown prominently.
- Vendor badge — people/companies related to the deal with a role (carpenter, plumber,
  photographer, etc.) → `deal_vendors` (Phase 2, already scoped).
- Employee badge → `deal_employees` (Phase 2, already scoped).
- Deal status and deal type shown in the header.

## Transaction / Employees tab

Assign employees (with role) and vendors (with role) to the deal — Transaction Guardian
territory, Phase 2, not urgent now.
