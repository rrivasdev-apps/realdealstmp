# Payroll Periods — reference from the original app

Source: Rafael's voice-transcribed walkthrough ("Payroll Periods Explained.pdf") plus
reference screenshots (create-period modal, the three dropdowns, and a list-view table).
**The screenshots are visual reference for the old app only** — RealDeals' actual UI
should be modern and well-designed (Claude acting as UX/UI expert), not a copy of the old
look. Only the functional structure below carries over.

Lives in Settings > Employee Center, next to Employee Roles — same location as today's
Pay Periods section.

## What a "pay period" actually is here

Not just a label — it's a reusable payroll-schedule *definition* an employee gets tagged
with, carrying its own type/frequency configuration and a rolling "next payday." Several
employees can share one definition (e.g. every hourly field agent on "Weekly Salary"); an
employee can be tagged with more than one (e.g. "Weekly Salary" + "Monthly Commissions"
for someone earning both a base wage and commission).

## Create/edit form fields

- **Pay Period Name*** — free text, required.
- **Payment Type*** — required, one of: **Salary**, **Commission**, **Combined**. Drives
  which of the fields below actually show (progressive disclosure) — the reference
  screenshot shows a flattened/static view of all fields for documentation purposes, but
  the voice walkthrough is explicit that Salary-only fields only appear for
  Salary/Combined, and Commission-only fields only appear for Commission/Combined.
- **Salary Pay Frequency*** — shown when Payment Type is Salary or Combined. Dropdown:
  Weekly / Bi-Weekly / Once a Month / Twice a Month.
- **Salary Type*** — shown when Payment Type is Salary or Combined. Dropdown: "Fixed
  Salary" or "Hourly" (the reference screenshot's literal option labels are "Yes - Fixed
  Salary" / "Yes - Hourly" — read as a legacy-app copy artifact, not a naming convention
  worth reproducing). Determines whether payroll calc looks up the employee's fixed
  salary or hourly rate off their profile, then divides/multiplies by the selected
  frequency as appropriate.
- **Commission Pay Frequency*** — shown when Payment Type is Commission or Combined.
  Dropdown: Weekly / Biweekly / Once a month / Twice a month / Quarterly / **Immediately
  on closing** (the last option triggers a payment the moment a deal closes, rather than
  on a fixed schedule — ties into the existing commission engine's
  `commission_types`/`employee_role_commission_types`/`profile_commission_types`
  stacking, per `src/lib/deals/commissions.ts`).
- **First Payday** — set once by the admin at creation (which day the *first* payment
  under this schedule should occur).
- **Next Payday** — updates automatically every time payroll actually runs for this
  period (i.e. server-computed going forward, not client-editable after creation — same
  "current vs. original" shape as `deals.closing_date` vs `original_closing_date`). Note:
  the reference's create-modal screenshot literally labels this field "Next Pay Day" even
  at creation time, which is a little confusing against the walkthrough's "first payday"
  language — read the create-time value as seeding what becomes "next payday" once runs
  start, not two independently-named fields that happen to look alike.
- **Comments/Observations*** — free text, required. Just documentation for whoever set up
  the schedule ("why this period works the way it does"), not used in any calculation.

## List page

Table columns: **Pay Period Name**, **Salary Pay Frequency**, **Commission Pay
Frequency**, **Next Pay Day** (each row only populates whichever frequency column
matches its Payment Type — a Commission-only row has a blank Salary Pay Frequency cell
and vice versa; a Combined row would populate both). Example rows from the reference:

| Pay Period Name | Salary Pay Frequency | Commission Pay Frequency | Next Pay Day |
|---|---|---|---|
| Monthly Commissions | | Once a Month | 6/25/24 |
| Staff No Track 2 a month | Twice a Month | | 5/10/24 |
| Weekly Salary | Weekly | | 2/16/24 |

## Notable modeling implications

- Today's `pay_periods` (shipped this week) is a flat company-scoped lookup — just
  `company_id` + `name`, the same shape as `markets`/`deal_types`, multi-assignable to an
  employee via `profile_pay_periods`. This reference describes something structurally
  bigger: `payment_type` (salary/commission/combined), `salary_pay_frequency`,
  `salary_type`, `commission_pay_frequency`, a `first_payday`, and a server-maintained
  `next_payday` — real columns with real behavior, not just a label.
- `next_payday` advancing "on occurrence of the payroll that runs on this kind of pay
  period" implies pay periods need to actually drive payroll runs (which employees/how
  much to pay, on what cadence) rather than being a passive tag — a meaningfully deeper
  integration with `payroll_runs`/`payroll_run_entries`
  (`src/lib/payroll/finalize-run.ts`) than exists today, where runs are created ad hoc
  with explicit start/end dates and no link back to a named pay period at all.
- "Immediately on closing" as a commission frequency option means a pay period can be an
  *event-triggered* schedule, not just a calendar cadence — worth keeping in mind once
  Transaction Guardian (event-triggered automation) is designed, since they're
  conceptually adjacent (both react to a deal closing).
- This is a real step up from what shipped — worth scoping as its own follow-up pass
  rather than folding in ad hoc, same reasoning as Contact Hub's reference doc.
