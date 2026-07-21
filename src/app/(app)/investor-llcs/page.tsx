import { createClient } from '@/lib/supabase/server'

import { InvestorLlcForm } from './investor-llc-form'

export default async function InvestorLlcsPage() {
  const supabase = await createClient()
  const { data: investorLlcs } = await supabase.from('investor_llcs').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-xl font-semibold">Company LLCs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        JV partner companies available to pick from a deal&apos;s JV Deal section.
      </p>

      <div className="mt-6 max-w-md">
        <InvestorLlcForm />
      </div>

      <ul className="mt-6 max-w-md divide-y divide-border">
        {investorLlcs?.map((investorLlc) => (
          <li key={investorLlc.id} className="py-3 text-sm">
            {investorLlc.name}
          </li>
        ))}
        {investorLlcs?.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">No company LLCs yet.</li>
        )}
      </ul>
    </div>
  )
}
