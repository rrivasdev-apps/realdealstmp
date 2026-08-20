import { redirect } from 'next/navigation'

import { LandingPage } from '@/app/_landing/landing-page'
import { requireUser } from '@/lib/supabase/auth'

export default async function Home() {
  const user = await requireUser()
  if (user) redirect('/dashboard')
  return <LandingPage />
}
