# Feature Set & Phased Roadmap — Real Estate Deal & Transaction Management Platform

This is the complete concept, independent of build order. `CLAUDE.md` tracks which
phase is currently active; this file is the reference for the full picture.

## Full feature set, by module

### 1. Deal Dashboard & KPIs
- Open deals view, split into for-sale (no investor/buyer attached) and pending
  (investor attached, not yet closed)
- Closed deals view, split into closed-and-funded vs. closed-not-yet-funded
- Headline metrics: projected profit, JV expenses, open offers
- Monthly / quarterly / yearly financial reporting: gross profit, total expenses,
  commissions, net profit, average profit per deal, deal/transaction counts,
  average days from contract to closing

### 2. Deal Whiteboard (intake & tracking)
- New deal capture: address, contract numbers, contract date
- Full closing-date lifecycle: estimated closing date, investor closing date,
  final closing date, plus a derived "current closing date" reflecting whichever
  is active for that stage
- Complete editable deal detail view as the deal moves through its lifecycle

### 3. Financial / Commission Engine
- Configurable, role-based commission rules (e.g., closer earns 1% of contract
  value on assignment) applied automatically on the triggering event
- JV expense allocation per deal
- Live gross profit and net profit that recalculate as commissions and expenses
  are added — this is the piece that was hardest to get right in the original
  build, and the main reason for owning the backend logic outright (see
  `architecture-decision.md`)

### 4. Contact Hub
- Vendors (roofers, electricians, etc.), realtors, clients, and investors, with
  the relationships each has to specific deals

### 5. Employee Center (workforce & permissions)
- Per-license workforce with roles and section-level permissions
- Payroll information tracking per employee

### 6. Transaction Guardian (automation engine)
- Automations triggered by deal events (created, closed, assigned, etc.)
- Named ownership of each automated step — who is responsible
- Automations that auto-populate deal fields as steps complete
- Longer-term: automations portable/sellable between companies

### 7. Settings / Configuration
- Geography: states, cities, zones, ZIP codes, markets
- Lead sources
- Per-company custom fields
- Deal tracker configuration: selling reasons, cancellation reasons, seller
  address types, expense types, transaction types, purchase types, deal types

### 8. Multi-Tenant / Licensing
- Company-level data isolation — each license gets its own workforce, contacts,
  and deals
- Foundation for a future automation marketplace between companies

### 9. API Layer
- Endpoints for external systems to read/write deal and contact data

## Phased roadmap

| Phase | Included | Goal |
|---|---|---|
| **Phase 0 — MVP** | Deal Whiteboard (core fields + closing-date lifecycle), basic Dashboard (open/for-sale/pending/closed lists), Contact Hub (basic), single-company login, simple profit calc (no commission engine yet) | Validate the deal pipeline and data model cheaply, with real deals, before building the hard parts |
| **Phase 1 — Financial Engine** | Role-based commission rules, JV expense tracking, cascading gross/net profit, monthly/quarterly/yearly KPI reporting | Rebuild the piece that broke down last time, this time in owned code |
| **Phase 2 — Operations** | Employee Center (roles, permissions, payroll), Transaction Guardian automation engine, per-company custom fields, full Settings module | Support a real operating team, not just a single user |
| **Phase 3 — Platform** | Multi-tenant licensing, API layer, automation marketplace | Turn it into something licensable to other companies |

See `market-opportunity.md` for why this feature set (specifically the financial/
automation layer) is the differentiated part worth protecting, and
`architecture-decision.md` for why it's being built this way.
