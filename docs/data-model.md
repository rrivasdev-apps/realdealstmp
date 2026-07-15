# Data Model — Reverse-Engineered from Original App Screens

Extracted from 12 screenshots of the original Bubble app's UI (Create Contact,
Add/View Showing, Add/View Offer, Deal Info/Action/Employee/Dispo tabs,
Transaction Guardian process views, Whiteboard, Company Dashboard). This
documents what the *finished-vision* data model looks like — it's a superset of
Phase 0. See the "Phase mapping" section at the end for what to actually build
now versus later. `CLAUDE.md` is the source of truth for current phase scope;
this file exists so nothing observed gets lost before it's needed.

We're extracting structure and functional requirements here, not copying any
proprietary implementation — same principle as the rest of this rebuild.

## Key structural discovery: the AB / BC contract pattern

The single biggest thing these screens clarify: a deal isn't "one contract with
several closing dates" — it's **two nested contracts**, tracked in parallel:

- **AB contract** — the wholesaler (B) buying from the seller (A). Fields:
  Actual Contract Price, Original Contract Price, Contract Date, Closing Date,
  Original Closing Date, Actual Closing Date, Due Diligence Expiration,
  Original Due Diligence Date, AB EMD$, AB EMD Deposit, AB-Purchase Type.
- **BC contract** — the wholesaler (B) assigning/selling to the end buyer or
  investor (C). Fields: Buyer Contract Price, Buyer Contract Date, BC Contract
  Closing Date, Buyer Inspection Deadline, Renegotiated BC Price, Buyer Deposit
  Amount.

Checklist and status fields confirm this split explicitly: **Renegotiation AB**
vs. **Renegotiation BC**, **Cancelled-AB** vs. **Cancelled-BC/AC**, **AB EMD
Deposit YN** vs. **BC EMD Deposit YN**. This is cleaner to model as two related
sub-objects than as one flat table with prefixed field names — worth doing
properly this time (see schema sketch below).

## Second structural pattern: original vs. current value pairing

Several fields exist in pairs — a value locked in at intake, and a current value
that can drift as the deal is renegotiated: Original Contract Price / Actual
Contract Price, Original Closing Date / Closing Date / Actual Closing Date,
Original Due Diligence Date / Due Diligence Expiration, Original Projected Sales
Price / Projected Sales Price. This is the general form of the "current closing
date" logic discussed earlier — apply the same rule everywhere this pattern
shows up: the "current" value is computed/updated server-side when a
renegotiation happens, the "original" value is set once at intake and never
touched again.

One data-quality note from the Whiteboard screenshot: "Days to Due Diligence"
shows negative values like `-20648` and `-87` on active deals — almost
certainly a date-math bug from exactly this kind of derived-field logic done in
Bubble workflows. Good concrete evidence for why this calculation needs to be a
single, tested, server-side function rather than scattered workflow logic.

## Core entities

### `companies` (tenant)
The multi-tenant boundary. Everything below belongs to a company.

### `deals`
- Property facts: address, market_id (→ markets), apn, legal_description,
  lot_size_acres, property_type_id (→ property_types)
- AB contract: contract_price, original_contract_price, contract_date,
  closing_date, original_closing_date, actual_closing_date,
  due_diligence_expiration, original_due_diligence_date,
  original_contract_deposit (bool/option), ab_purchase_type_id (→
  purchase_types), ab_emd_amount, ab_emd_deposit_received (bool)
- BC contract: buyer_found (bool), buyer_contract_price, buyer_contract_date,
  bc_contract_closing_date, buyer_inspection_deadline,
  renegotiated_bc_price, buyer_deposit_flag, buyer_deposit_amount,
  buyer_extension_id (→ option set)
- Dispo/JV: original_projected_sales_price, projected_sales_price, is_jv_deal
  (bool), jv_partner_company_id (→ investor_llcs or companies),
  jv_split_type_id (→ split_types), jv_split_percent, split_amount
- Mortgage/payoff: mortgage_company_contact_id (→ contacts), payoff_ordered
  (bool), mortgage_principal_balance, mortgage_rate, mortgage_term,
  in_foreclosure (bool/option), foreclosure_date, total_payoff_amount
- Status/meta: deal_type_id (→ deal_types), status_id (→ deal_statuses: For
  Sale / Pending Sale / Closed / On Hold / Cancelled), owner_employee_id (→
  employees), lead_source_id (→ lead_sources), title_opened (bool),
  is_listed (bool)
- Custom fields: a `custom_fields JSONB` column, **not** ad-hoc named columns.
  The original app has fields literally named "Test 1," "Test Text C," "Test
  NumA" directly on the deal object — evidence of exactly the ad-hoc-column
  problem a JSONB custom-fields design avoids.

### `deal_selling_reasons` (join table)
`deal_id` × `selling_reason_id` — multi-select, so it's many-to-many, not a
single field on `deals`.

### `contacts`
- name
- Multi-select types via join table `contact_contact_types` (`contact_id` ×
  `contact_type_id`) — a contact can be Investor + Realtor + Vendor
  simultaneously, per the UI's multi-select button group.
- investor_type_id (→ investor_types), only meaningful when type includes
  Investor
- investor_llc_id (→ investor_llcs), nullable — set via "Link to Investor LLC"

### `contact_phone_numbers`
`contact_id`, `type_id` (→ phone_types), `phone` — up to 3 in the UI, but model
as an unbounded child table, not 3 fixed columns.

### `contact_emails`
`contact_id`, `type_id` (→ email_types), `email` — same pattern as phone
numbers.

### `investor_llcs`
id, name — a standalone entity separate from `contacts`, since investors can be
individuals or LLCs and either can be linked to a deal via JV Partner Company.

### `offers`
deal_id, offer_price, offer_date, status_id (→ offer_statuses), 
inspection_deadline, closing_deadline, emd_deadline, purchase_type_id (→
purchase_types — same option set as ab_purchase_type_id), realtor_contact_id (→
contacts), investor_contact_id (→ contacts), notes

### `showings`
deal_id, showing_date, status_id (→ showing_statuses), buyer_contact_id (→
contacts), vendor_contact_id (→ contacts), details

### `employees`
Per-company workforce. Referenced heavily — also has its own dashboard
("My Pay And Time"), implying payroll/time-tracking fields belong here (Phase
2, Employee Sentinel).

### `deal_employees` (join table)
deal_id, employee_id, role_id (→ deal_employee_roles — e.g. "TC" for
Transaction Coordinator, "Closer")

### `deal_vendors` (join table)
deal_id, vendor_contact_id (→ contacts, filtered to Vendor type), role_id (→
deal_vendor_roles — e.g. Roofer, Electrician)

### `checklist_items` (definition table) + `deal_checklist_status` (join)
The right-panel Checklist tab is a configurable list, not fixed UI: Post
Occupancy, Survey Needed, Initial Photos Needed, Closing Extension,
Renegotiation AB, Renegotiation BC, Due Diligence Extension, Memo, On Hold,
Cancelled-AB, Cancelled-BC/AC, AB EMD Deposit YN, BC EMD Deposit YN, Seller Info
Sheet Needed. Model as a definition table (per company, so it's configurable
like the Settings module) plus a join table holding the boolean per deal.

### Transaction Guardian: `automation_templates`, `automation_template_steps`, `automation_processes`, `automation_steps`
This is a template/instance split:
- `automation_templates`: id, name (e.g. "Wholesale Deal Phase 1," "Listing Day
  1," "Miniautomator Test TPT") — the reusable definition, per company.
- `automation_template_steps`: template_id, step_number, name, description,
  due_date_rule, and — critically — a link to which **deal fields** this step
  updates when completed (seen directly in the screenshot: a step titled "EMD
  for Deal" surfaces "AB EMD$" and "AB EMD Deposit" as editable fields inside
  the step itself). Model this as `automation_template_step_field_targets`
  (step_id, deal_field_name).
- `automation_processes`: deal_id, template_id, status (running/completed),
  started_at — a running instance of a template on a specific deal. The
  Action tab shows a deal can have several running simultaneously ("3
  Processes Running On Deal").
- `automation_steps`: process_id, step_number, status (pending/completed),
  completed_at — the per-instance record of each step's progress, separate
  from the template step definition.
- Processes can be started two ways: automatically (deal event trigger) or
  manually — the Action tab has an explicit "Start an Automator Manually For
  This Deal" button. Both paths need to be supported.

## Lookup / option-set tables found in the dropdowns

Every dropdown in these screens is a table, not a hardcoded list — flagging
each one and what's known about its values:

| Option-set table | Where seen | Known/likely values |
|---|---|---|
| `contact_types` | Create Contact (multi-select) | Investor, Realtor, Lender, All In One, Title Company, Vendor, Seller, Mortgage Company, Test, Other/POC |
| `phone_types` | Create Contact | unlabeled in screenshot — likely Mobile/Home/Work |
| `email_types` | Create Contact | unlabeled — likely Personal/Work |
| `investor_types` | Create Contact (conditional) | unlabeled — needs discovery |
| `showing_statuses` | Add/View Showing | Scheduled (+ likely Completed, Cancelled, No-Show) |
| `offer_statuses` | Add/View Offer | Pending (+ likely Accepted, Rejected, Countered, Expired) |
| `purchase_types` | Add/View Offer, Deal Info (AB-Purchase Type) | shared between both — one table, two usages |
| `split_types` | Dispo tab | Percentage (+ likely Flat Fee / Fixed Amount) |
| `deal_employee_roles` | Employee tab | TC (Transaction Coordinator), and per earlier conversation, Closer |
| `deal_vendor_roles` | Employee tab | unlabeled — e.g. Roofer, Electrician |
| `property_types` | Deal Info | unlabeled |
| `lead_sources` | Deal Info | company-configurable, matches Settings module |
| `selling_reasons` | Deal Info (multi-select) | company-configurable, matches Settings module |
| `markets` | Deal Info | company-configurable, matches Settings module |
| `deal_types` | Deal Info header | company-configurable, matches Settings module |
| `deal_statuses` | Whiteboard / Company Dashboard | For Sale, Pending Sale, Closed, On Hold, Cancelled |

Yes/No fields (Buyer Found?, Buyer Deposit?, Original Contract Deposit?, In
Foreclosure) render as dropdowns in the original app rather than checkboxes —
worth deciding deliberately whether to keep them as a Yes/No option set (easier
to extend to "Unknown" or "Pending" later) or simplify to real booleans. Lean
toward boolean unless a third state is genuinely needed.

## Relationship (not lookup) dropdowns

These reference real entity tables, filtered by contact type, not option sets:
Buyer Contact (POC), Vendor Contact (POC), Offer Realtor, Offer Investor
Contact, Buyer Contact / Buyer Agent Contacts, Seller Info, Mortgage Company,
Employee (assignment), Desired Vendor, JV Partner Company. All resolve to
`contacts` (or `investor_llcs` for JV Partner Company), typically pre-filtered
by `contact_type` in the picker.

## Other observations worth keeping

- **API access is company-scoped and self-serve**: the Company Dashboard has
  "Generate Company Token" and "Copy endpoints" buttons — the API layer
  (Phase 3) should let each tenant generate and manage their own credentials,
  not require a manual/support-driven process.
- **Time tracking exists**: a "Not Tracking 00:00:00" play/stop control in the
  top bar, plus a "My Pay And Time" nav item — an employee-facing time-tracking
  feature tied to payroll, not previously captured in the feature list. Belongs
  in Phase 2 (Employee Sentinel).
- **A "TPT Process" status bar** on the deal (badges: NAT, OTTO, FW, MSB, STC,
  each with a colored status dot) appears to summarize several parallel
  automation tracks at a glance. Worth clarifying the actual meaning of these
  abbreviations before building the equivalent — don't guess and hard-code
  labels that turn out wrong.
- **Reporting split**: the Company Dashboard separates an all-time "Pipeline"
  snapshot from a date-filtered "Period Performance" (Monthly/Quarterly/Yearly)
  section with its own deal counts and financials — these are two different
  queries, not one, and Phase 1's KPI reporting should plan for both.

## Phase mapping

- **Phase 0 (current)**: `deals` (AB-contract fields + property facts +
  status), `contacts` (with types, phones, emails), basic dashboard/whiteboard
  list. Use the real field names above instead of the earlier placeholder
  schema in `CLAUDE.md` — it's been updated to match.
- **Phase 1**: `offers`, `showings`, BC-contract fields on `deals`, JV fields,
  commission engine, checklist system, Company Dashboard financial rollups.
- **Phase 2**: `employees`, `deal_employees`, `deal_vendors`, time tracking /
  payroll, `automation_templates` + `automation_processes` (Transaction
  Guardian), custom fields (JSONB), Settings-module lookup tables becoming
  company-configurable rather than hardcoded.
- **Phase 3**: `investor_llcs` linking, multi-tenant `companies` becoming a
  real onboarding flow, API token generation/management.
