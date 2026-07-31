import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { calculateProfit, currentSellingPrice } from './profit'

// Only the fields the calculation logic needs -- callers pass in whatever
// shape their query returned (with or without id/company_id/etc).
type CommissionValues = {
  category: string
  basis: string | null
  value: number
}

type CommissionType = Database['public']['Tables']['commission_types']['Row']

type DealNumbers = {
  contract_price: number | null
  renegotiated_bc_price: number | null
  buyer_contract_price: number | null
  projected_sales_price: number | null
}

type DealFundedInfo = {
  actual_closing_date: string | null
  deal_statuses: { name: string } | null
}

// A deal is "funded" the same way the dashboard's Closed & Funded filter
// defines it: status Closed and actual_closing_date set.
export function isDealFunded(deal: DealFundedInfo): boolean {
  return deal.deal_statuses?.name === 'Closed' && deal.actual_closing_date != null
}

// Flat and contract-price-basis commissions are calculable from day one --
// the contract price is known at intake. gross_profit and
// current_selling_price both depend on the selling side, which per Rafael
// is just a moving estimate until the deal actually closes and funds, so
// those wait until then to lock in a number.
export function isCommissionCalculable(commissionType: CommissionValues, dealFunded: boolean): boolean {
  if (commissionType.category === 'flat') return true
  if (commissionType.basis === 'contract_price') return true
  return dealFunded
}

export function calculateCommissionAmount(commissionType: CommissionValues, deal: DealNumbers): number | null {
  if (commissionType.category === 'flat') {
    return commissionType.value
  }

  const base =
    commissionType.basis === 'contract_price'
      ? deal.contract_price
      : commissionType.basis === 'gross_profit'
        ? calculateProfit(deal)
        : currentSellingPrice(deal)

  if (base == null) {
    return null
  }

  return (base * commissionType.value) / 100
}

// Direct profile-level assignment always applies + every commission type
// tied to the role(s) the employee was assigned to play on *this* deal --
// not every role they hold company-wide; an employee configured as both
// Closer and TC only earns Closer commissions on a deal he was added to as
// Closer.
async function applicableCommissionTypesFor(
  supabase: SupabaseClient<Database>,
  profileId: string,
  employeeRoleIds: string[]
): Promise<CommissionType[]> {
  const [{ data: direct }, { data: viaRole }] = await Promise.all([
    supabase.from('profile_commission_types').select('commission_types(*)').eq('profile_id', profileId),
    employeeRoleIds.length
      ? supabase
          .from('employee_role_commission_types')
          .select('commission_types(*)')
          .in('employee_role_id', employeeRoleIds)
      : Promise.resolve({ data: [] }),
  ])

  return [...(direct ?? []), ...(viaRole ?? [])]
    .map((row) => row.commission_types)
    .filter((ct): ct is CommissionType => ct != null)
}

// Called when an employee is added to a deal: creates one payment row per
// applicable commission type.
export async function createCommissionPaymentsForDealEmployee(
  supabase: SupabaseClient<Database>,
  params: { companyId: string; dealId: string; profileId: string; employeeRoleIds: string[] }
) {
  const { companyId, dealId, profileId, employeeRoleIds } = params

  const { data: deal } = await supabase
    .from('deals')
    .select(
      'contract_price, renegotiated_bc_price, buyer_contract_price, projected_sales_price, actual_closing_date, deal_statuses(name)'
    )
    .eq('id', dealId)
    .single()

  if (!deal) {
    return
  }

  const commissionTypes = await applicableCommissionTypesFor(supabase, profileId, employeeRoleIds)

  if (commissionTypes.length === 0) {
    return
  }

  const funded = isDealFunded(deal)

  const rows = commissionTypes.map((commissionType) => {
    const calculable = isCommissionCalculable(commissionType, funded)
    return {
      company_id: companyId,
      type: 'commission',
      deal_id: dealId,
      profile_id: profileId,
      commission_type_id: commissionType.id,
      amount: calculable ? calculateCommissionAmount(commissionType, deal) : null,
      status: calculable ? 'pending' : 'created',
    }
  })

  await supabase.from('payments').insert(rows)
}

// Called when an employee's per-deal role selection changes: reconciles
// their commission payments on this deal to match whatever the new role
// selection earns. Payments for commission types that no longer apply are
// deleted outright (per Rafael: they never represented real money moving);
// payments for newly-applicable commission types are created; payments for
// commission types that still apply are left untouched. If any
// no-longer-applicable commission type has already been marked 'paid', the
// whole change is refused -- paid money is never silently erased.
export async function syncCommissionPaymentsForDealEmployeeRoles(
  supabase: SupabaseClient<Database>,
  params: { companyId: string; dealId: string; profileId: string; employeeRoleIds: string[] }
): Promise<{ error?: string }> {
  const { companyId, dealId, profileId, employeeRoleIds } = params

  const [{ data: deal }, { data: existingPayments }] = await Promise.all([
    supabase
      .from('deals')
      .select(
        'contract_price, renegotiated_bc_price, buyer_contract_price, projected_sales_price, actual_closing_date, deal_statuses(name)'
      )
      .eq('id', dealId)
      .single(),
    supabase
      .from('payments')
      .select('id, commission_type_id, status')
      .eq('deal_id', dealId)
      .eq('profile_id', profileId)
      .eq('type', 'commission'),
  ])

  if (!deal) {
    return {}
  }

  const desiredTypes = await applicableCommissionTypesFor(supabase, profileId, employeeRoleIds)
  const desiredTypeIds = new Set(desiredTypes.map((ct) => ct.id))

  const noLongerApplicable = (existingPayments ?? []).filter(
    (payment) => payment.commission_type_id && !desiredTypeIds.has(payment.commission_type_id)
  )
  if (noLongerApplicable.some((payment) => payment.status === 'paid')) {
    return { error: 'Cannot change roles: a commission tied to a role being removed has already been paid.' }
  }

  const existingTypeIds = new Set((existingPayments ?? []).map((payment) => payment.commission_type_id))
  const newlyApplicable = desiredTypes.filter((ct) => !existingTypeIds.has(ct.id))

  if (noLongerApplicable.length > 0) {
    await supabase
      .from('payments')
      .delete()
      .in('id', noLongerApplicable.map((payment) => payment.id))
  }

  if (newlyApplicable.length > 0) {
    const funded = isDealFunded(deal)
    const rows = newlyApplicable.map((commissionType) => {
      const calculable = isCommissionCalculable(commissionType, funded)
      return {
        company_id: companyId,
        type: 'commission',
        deal_id: dealId,
        profile_id: profileId,
        commission_type_id: commissionType.id,
        amount: calculable ? calculateCommissionAmount(commissionType, deal) : null,
        status: calculable ? 'pending' : 'created',
      }
    })
    await supabase.from('payments').insert(rows)
  }

  return {}
}

// Called when an employee is removed from a deal entirely: deletes every
// not-yet-paid commission payment tied to them on this deal. Refuses (and
// leaves the deal_employee row in place) if any of those payments are
// already 'paid' -- removing the assignment must not erase paid history.
export async function removeCommissionPaymentsForDealEmployee(
  supabase: SupabaseClient<Database>,
  params: { dealId: string; profileId: string }
): Promise<{ error?: string }> {
  const { dealId, profileId } = params

  const { data: existingPayments } = await supabase
    .from('payments')
    .select('id, status')
    .eq('deal_id', dealId)
    .eq('profile_id', profileId)
    .eq('type', 'commission')

  if ((existingPayments ?? []).some((payment) => payment.status === 'paid')) {
    return { error: 'Cannot remove this employee: a commission on this deal has already been paid.' }
  }

  if (existingPayments?.length) {
    await supabase
      .from('payments')
      .delete()
      .in('id', existingPayments.map((payment) => payment.id))
  }

  return {}
}

// Called after any deal update that could move a commission-relevant number
// (a price renegotiation, or the deal becoming Closed & funded): recomputes
// every still-open commission payment on the deal. 'pending' rows get their
// amount refreshed to the current numbers (same "whatever is current" rule
// as the rest of the app); 'created' rows flip to 'pending' with a computed
// amount once the deal is funded, and are left alone otherwise. 'paid' rows
// are never touched.
export async function syncCommissionPaymentsForDeal(supabase: SupabaseClient<Database>, dealId: string) {
  const { data: deal } = await supabase
    .from('deals')
    .select(
      'contract_price, renegotiated_bc_price, buyer_contract_price, projected_sales_price, actual_closing_date, deal_statuses(name)'
    )
    .eq('id', dealId)
    .single()

  if (!deal) {
    return
  }

  const { data: openPayments } = await supabase
    .from('payments')
    .select('id, status, commission_types(category, basis, value)')
    .eq('deal_id', dealId)
    .eq('type', 'commission')
    .in('status', ['created', 'pending'])

  if (!openPayments?.length) {
    return
  }

  const funded = isDealFunded(deal)

  await Promise.all(
    openPayments.map((payment) => {
      const commissionType = payment.commission_types
      if (!commissionType) {
        return Promise.resolve()
      }

      const calculable = isCommissionCalculable(commissionType, funded)
      if (!calculable) {
        return Promise.resolve()
      }

      const amount = calculateCommissionAmount(commissionType, deal)
      return supabase.from('payments').update({ amount, status: 'pending' }).eq('id', payment.id)
    })
  )
}
