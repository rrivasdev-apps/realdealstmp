import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function LandingHeader() {
  const t = await getTranslations('Landing')

  return (
    <header className="sticky top-0 z-20 border-b border-landing-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6 lg:h-[90px]">
        <span className="text-lg font-bold tracking-tight text-landing-navy">
          Real<span className="text-landing-blue">Deals</span>
        </span>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-landing-ink hover:text-landing-blue">
            {t('navFeatures')}
          </a>
          <a href="#why" className="text-sm font-medium text-landing-ink hover:text-landing-blue">
            {t('navWhy')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-landing-navy hover:text-landing-blue"
          >
            {t('ctaSignIn')}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-landing-lime px-4 py-2 text-sm font-semibold text-landing-navy transition hover:bg-landing-lime-dark hover:text-white"
          >
            {t('ctaSignUp')}
          </Link>
        </div>
      </div>
    </header>
  )
}
