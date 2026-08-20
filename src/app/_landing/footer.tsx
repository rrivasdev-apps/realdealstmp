import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function LandingFooter() {
  const t = await getTranslations('Landing')

  return (
    <footer className="bg-landing-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-lg font-bold tracking-tight text-white">
            Real<span className="text-landing-cyan">Deals</span>
          </span>
          <p className="mt-2 max-w-sm text-sm text-white/60">{t('footerTagline')}</p>
        </div>

        <div className="flex gap-6">
          <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white">
            {t('ctaSignIn')}
          </Link>
          <Link href="/signup" className="text-sm font-medium text-white/80 hover:text-white">
            {t('ctaSignUp')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
