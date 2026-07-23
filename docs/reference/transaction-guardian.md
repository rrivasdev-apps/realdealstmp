# Transaction Guardian — reference from the original app

Source: Rafael's voice-transcribed walkthrough ("Transaction Guardian Explained.pdf") plus
reference screenshots (automator general settings, step editor, and each action type's
config modal). **The screenshots are visual reference only** — RealDeals' actual UI should
be modern and well-designed (Claude acting as UX/UI expert), not a copy of the old look.
Only the functional structure below carries over.

Per Rafael: "Transaction Guardian" is a legacy name — this should actually be called
**Automations** or **Deal Automations**. Two separate locations in the app, both covered
below:

- **Automations**, inside **Settings** — where automations are *designed* (the builder).
  See "Settings > Automations" through "Trigger" below.
- **Deal Automations** (main left nav, plus a per-deal sub-menu) — where automations
  actually *run* against a specific deal: instances get created, steps become due, users
  complete them. See "Runtime — Deal Automations" below.

Also per Rafael: in the original app these were called "automators," and the transcript
uses "automator"/"automation" interchangeably as a result — read them as the same thing.
Worth deciding deliberately which term RealDeals standardizes on before building the UI.

## Settings > Automations — list view

Landing page for the section: a list of every automator already defined for the company,
showing name and the deal type/area it's associated with, plus a **New** button.

## Creating an automator — general settings

A new automator starts with a general-settings block, separate from its steps:

- **Name** — free text.
- **Trigger** ("Choose when this Automator starts") — one of:
  1. **Any deal is created** (optionally scoped to a specific deal type — "Any Deal is
     Created With Any Type" in the reference screenshot implies the type is itself a
     filter, not just "any").
  2. **When a field value changes** — a specific deal field's value changing starts the
     automator.
  3. **When a certain step of another automator is finished** — lets one automator chain
     off another's step completion, purely by reference (separate from the
     per-step "trigger another automator" action described below — this is the trigger
     side of that same relationship).
  4. **When a custom field's value changes** — deliberately a separate trigger option
     from #2, since custom fields aren't normal columns and "have a different behavior."
  5. **Date-based** — reached / before / after a specific date field, with a "how many
     days before/after" offset. Picking this asks: which date field, before-or-after, and
     the day offset.
- **How many days after Automator triggers should the Automator start and be visible to
  users** — a delay between the trigger firing and the automator actually starting/showing
  up to users.
- **How many days after Automator starts should the first step be due** — separate delay
  for when the first step's due date lands, relative to the automator's start.
- A small diagram in the reference UI visualizes this timeline: **Triggered** → (X days) →
  **Starts And Visible** → (X days) → **First Step Due**.

Once saved, the automator shows a status badge: **Automator Functional** / **Automator Not
Functional** (i.e. it's not usable/runnable until its steps are fully configured). Actions
available on the automator itself: Save, Duplicate, Delete, Done.

## Steps

An automator is an ordered sequence of steps. Each step shows its number, an operational
status badge (**Step Operational** / **Step Not Operational**), and — until configured — a
"Drop Action here" area. You drag one of the available action types onto it:

**Fill Fields**, **Conditional Statement**, **Email Task**, **Call Task**, **Generic
Task**, **Trigger**, **Option List**, **Show Text**.

Whichever type is dropped becomes that step's action for good (the reference UI didn't
show a way to change a step's type after the fact, only delete/recreate).

### Common to every step

Every step (regardless of action type) needs:

- **Task Assignee** — either **Assign To Role** (dropdown of company roles; **Transaction
  Coordinator is the default**) or **Specific User** (dropdown of company users/employees).
  Exactly one of a role or a specific person is always responsible for a step.
- **Next-step behavior**, configured *after* the type-specific fields: either **Go to
  Another Step** (pick which step from the ones already created, plus "how many days after
  this step is completed should the next step be due") or **Complete The Automator** (this
  step ends the run).
- **Trigger another automator on this step's completion** — a checkbox that, when
  checked, lets you pick one or more other automators to kick off. Available independent
  of the go-to-another-step/complete-automator choice.

### Simple action types: Email Task, Call Task, Generic Task, Show Text

All four share one config shape — assignee, then:

- **Task Title**
- **Task Description**
- Then the common next-step behavior above.

("Show Text" is a plain reminder — no email/call semantics, just surfaces the description
as a to-do on the assigned date/step.) None of these four action types have their own
special fields beyond title/description — they differ only in what icon/semantics they
imply for the resulting task.

### Fill Fields ("Update Fields" in the actual modal)

- Assignee, then **Task Title**.
- **Select Deal Fields to Update** — an "Add Field" dropdown plus a running **List of
  Fields to Update**: each field added appears in a vertical, individually-removable
  (✕) list. The list has a fixed max height and scrolls internally rather than growing the
  step/page.
- **Select Custom Fields to Update** — a second, separate picker/list with the same
  shape, because custom fields aren't ordinary columns and are tracked distinctly.
- Then the common next-step behavior.

This is the step type that actually mutates deal data when completed — e.g. the "EMD for
Deal" example step surfaces "AB EMD$" and "AB EMD Deposit" as fields the user fills in
directly on completing that step.

### Conditional Statement

A strict two-branch decision, not open-ended:

- Assignee.
- **Question** (free text prompt).
- **Option 1** (free text for that branch's label/answer) → its own **Choose Option 1
  Functionality** (Go to Another Step + due-days, or Complete The Automator) → its own
  "On Option 1 Selection Start Another Automator" checkbox + picker.
- **Option 2** — identical shape, fully independent from Option 1's behavior.

Each of the two options has its own complete next-step/trigger-automator configuration —
picking Option 1 vs Option 2 at runtime can send the deal down entirely different paths.

### Option List

Like Conditional Statement generalized to up to **10** options, with a single/multiple
choice switch that changes what's configurable per option:

- Choose **Single Choice** or **Multiple Choice** first — this changes the rest of the
  form.
- Assignee, then **Option Task Title/Description**.
- **Options List** — "Add Option" button; hard cap of 10, with a live "you have N left"
  counter.
  - **Single Choice**: each option gets its own next-step behavior (go to another step +
    due-days, or complete the automator) *and* its own "trigger another automator on this
    option's selection" checkbox — same per-branch shape as Conditional Statement, just
    scaled to more branches.
  - **Multiple Choice**: individual options only get a "trigger another automator when
    this option is selected" checkbox — no per-option next-step behavior, since more than
    one can be true at once. Instead there's a single step-level **Choose Step Completion
    Functionality** (Go to Another Step / Complete The Automator) that applies regardless
    of which option(s) got picked, plus one step-level "on step completion start another
    automator" checkbox.
- Whichever option(s) got selected on a given deal's run must be persisted — it's part of
  that deal's automation history, not just a UI selection that's thrown away.

### Trigger

No config modal at all — dragging this type onto a step needs no fields. It's a pure
pass-through: the step exists only to run the common next-step behavior (go to another
step / complete the automator) and/or fire off another automator on completion. Useful as
a lightweight junction/relay step.

## Runtime — Deal Automations (execution side)

### How a running automation actually advances

When an automator is triggered, the *whole* step flow for that run is created up front —
not one step at a time. Only the first-due step actually gets a due status and a due date
(computed from the template's day-offset rules); every other step starts in some
not-yet-active status (Rafael floated "programmed" or "created" as placeholder words —
the exact label doesn't matter, but it must be distinguishable from "due"). Not-yet-active
steps are hidden from users entirely. As the flow advances and a step becomes the current
one, it flips to due and becomes visible on the date that corresponds.

This "create everything up front" description was walked through using a simple linear
example (step 1 → step 2 → done) — it doesn't obviously resolve how a **branching**
automator (Conditional Statement / Option List, single choice) pre-creates steps it can't
yet know it'll reach, since which branch fires depends on an answer the user hasn't given
yet. Worth resolving deliberately when this gets built (see modeling implications below)
rather than assuming the linear case generalizes as-is.

### Global dashboard — "Transaction Guardian Dashboard" (main left nav)

- Four summary stat tiles at the top: **Overdue Steps**, **Due Today Steps**, **Due This
  Week Steps**, **Active Steps** — counts across the whole company.
- Below that, a filterable **"Deals With Active Processes"** report, one row per deal that
  has at least one running process:
  - Filters: **Select Address** (typeahead against deal address) and **Select Employee**
    (dropdown) — needed because this list can get long. A filter icon reveals/collapses
    the filter controls.
  - Each row shows: address, deal status + close date, number of automators running,
    action counts broken out as overdue / due today / due in the future, and Projected
    Profit and Revenue.
  - Each row expands ("View Deal's Running Processes") to list that deal's individual
    running processes — automator name + current step name, due date, a percent-complete
    progress bar, and a Complete indicator.
  - Clicking directly on an overdue/due action drills straight into that deal's Deal
    Automations sub-menu, opened right to that step's action detail — a deep link, not
    just a bounce to the deal's general page.
  - Color coding for urgency, used consistently everywhere a step/process shows up (this
    dashboard and the per-deal view alike): **overdue = red**, **due today = yellow**,
    **due in the future = green** — all as *light* background tints, not solid/saturated
    fills.

### Per-deal "Deal Automations" sub-menu

Reached either from the dashboard drill-down above, or from within a specific deal's own
left-side sub-menu (same nested-sidebar pattern as the deal detail page's other sections).

- Header actions: **Go To Deal**, **Go To Whiteboard**, **Go To Transaction Guardian
  Dashboard**, plus a "N Processes Running On Deal" badge.
- **"Deal's Processes"** panel: toggles between **N Completed Processes** and **N Running
  Processes**.
- **"Start an Automator Manually For This Deal"** button — confirms the two trigger paths
  already noted in `docs/data-model.md` (automatic via the configured trigger, or manual)
  both need to exist; this is the manual path's entry point.
- Each running process row: automator/current-step name, due date, percent-complete bar,
  Complete state.
- Drilling into one process opens its **action detail**:
  - Breadcrumb back to "All of Deal's Processes."
  - Current step's info (name, type, due date) and a **"View All Steps"** toggle plus
    **"View Current Step"** button.
  - The actual action UI, rendered per step type — e.g. a Fill Fields step shows the
    exact deal fields it was configured to update as live editable inputs (checkbox, date,
    currency, in the walkthrough's example).
  - Two explicit completion buttons: **"This Has Been Completed"** and **"This Hasn't Been
    Completed"** — not just a single "mark done" action.
  - A preview of what happens next: **"Next Step: Step N — <type> — <name>"**, shown right
    below the current step's action.
  - An **Activity Log** panel alongside the action detail — a running log for that
    specific process.

### Completing a step

Hitting "This Has Been Completed": applies whatever the step type requires (e.g. writes
the configured Fill Fields values to the deal), marks that step instance complete, advances
the process to its next planned step, and computes that next step's due date from the
configured day-offset. The just-completed step's "next step" preview is what tells the user
what's coming.

Percent-complete is tracked per **process** (i.e. per automator instance running on a
specific deal) — it accumulates as steps complete over the process's lifetime, which is
bound to the deal it's running on (an automation's life span is the deal's life span, not
independent of it).

## Notable modeling implications

- `docs/data-model.md`'s existing Transaction Guardian sketch (`automation_templates`,
  `automation_template_steps`, `automation_processes`, `automation_steps`,
  `automation_template_step_field_targets`) captures the template/instance split
  correctly, but is far too thin on **step type**: this walkthrough describes 8 distinct
  action types (Fill Fields, Conditional Statement, Email Task, Call Task, Generic Task,
  Show Text, Option List, Trigger), each with its own config shape. `automation_template_steps`
  needs a `step_type` discriminator plus type-specific config (likely JSONB, given how much
  the shape varies — a single-choice Option List step alone needs up to 10 branches, each
  with its own next-step target and automator-trigger list).
- **Branching is real, not just linear.** Conditional Statement and single-choice Option
  List steps each define *multiple* next-step targets (one per option), not the single
  `next step` the current sketch implies. A step's "what happens next" needs to be
  modeled per-option where applicable, not as one column on the step.
- **Cross-automator triggering happens in two directions**: (a) a trigger type on the
  *automator itself* — "start when a certain step of another automator finishes" — and
  (b) a per-step (or per-option) action — "on this step/option, start another automator."
  Both need modeling; they're the two ends of the same relationship and should probably
  share one join shape (`triggering_step_id` → `triggered_automator_id`, with an optional
  `option_key` for which branch of a branching step fired it).
- **Automator triggers are richer than "deal created"**: any-deal-created (optionally
  type-scoped), field-value-changed, custom-field-value-changed (deliberately separate
  from normal fields), another-automator's-step-finished, and date-based
  (before/after/on, with a day offset) are five distinct trigger shapes — `deal_events`-style
  polling or dedicated triggers per type will likely be needed, not one generic mechanism.
- **Per-step assignee** (role or specific user) is new information not in the original
  sketch — steps need an assignee column pair (`assigned_role_id` nullable /
  `assigned_profile_id` nullable, same "exactly one of the two" shape as elsewhere in the
  schema, e.g. `deal_employees`).
- **Timing has three independent offsets**, not one: trigger → start/visible delay, start
  → first-step-due delay, and then each step's own "days after previous step completes ->
  this step due." All three need separate day-offset fields.
- **"Pre-create every step up front" doesn't obviously survive branching.** The runtime
  walkthrough describes instantiating the whole step flow the moment an automator
  triggers, with only the first step due and the rest hidden-but-created. That's clean for
  a linear chain, but a Conditional Statement or single-choice Option List step doesn't
  know which branch it'll take until a user answers it at runtime — there's no "next step"
  to pre-create yet at trigger time past a branch point. Two reasonable resolutions: (a)
  eagerly create instance rows only for the deterministic prefix of the flow (up to the
  first unresolved branch), lazily creating the rest as branches get resolved, or (b) treat
  "pre-create everything" as specific to simple/linear automators and always lazily
  create-on-advance for anything containing a branching step. Needs a decision before the
  process/step-instance schema is finalized — don't default to (a) or (b) without checking
  with Rafael, since it changes what `automation_steps` rows exist and when.
- **Step-instance status needs a third state**, not just pending/completed as
  `docs/data-model.md`'s original sketch says: hidden-but-created (not yet due), due
  (currently active/visible), and completed. The dashboard's red/yellow/green urgency
  coloring (overdue / due today / due-in-future) is a further breakdown of the "due" state
  by how the due date compares to today — that's a derived bucket, not a stored status, and
  per the "profit calc lives in one shared function" convention already established in this
  codebase, the overdue/today/future bucketing should be one shared function too, reused by
  both the dashboard stat tiles and the per-deal view (the doc is explicit the coloring
  must be consistent between the two).
- **Percent-complete per process** needs a concrete formula. With linear automators this is
  simple (steps completed / total steps), but branching automators don't have a fixed total
  step count known up front — the denominator depends on which path gets taken. Needs a
  decision (e.g. "steps completed / steps completed + at least one remaining," or track
  against the template's step count assuming no branch, and accept it's an approximation
  when a branch is taken) rather than assuming the simple case generalizes.
- **Assignee resolution at runtime is unresolved.** A step configured "Assign To Role"
  needs to resolve to an actual person for the dashboard's per-employee filter to work.
  Freezing an assignee at process-creation time would misassign if company role membership
  changes mid-deal (a long-lived process, since its lifespan matches the deal's) — a
  query-time join (whoever currently holds that role) is probably right, but should be a
  deliberate choice, not a side effect of however the join happens to get written.
- **A shared step-action-detail view** needs two entry points into the same
  data — the global Transaction Guardian Dashboard's drill-down, and a specific deal's own
  Deal Automations sub-nav — both showing/acting on the identical process-step record. Model
  and build this as one component/route with two links in, not two separate
  implementations that could drift.
- **Activity log per process** is a new requirement not in the original sketch — some kind
  of append-only event log (step became due, step completed, fields changed) scoped to a
  single `automation_processes` row. Worth checking whether an existing generic
  activity-log pattern already exists elsewhere in the codebase before designing a new one.
- This is meaningfully more complex than the existing sketch suggested — worth treating as
  its own scoping pass (like Contact Hub's and Payroll Periods' reference docs) rather than
  starting schema work off this doc alone. Both halves (builder + runtime) are now
  documented, so the next step is a dedicated design/scoping pass before writing any
  migrations.
