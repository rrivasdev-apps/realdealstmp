import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { CheckIcon } from '@/components/icons'

export async function LandingHero() {
  const t = await getTranslations('Landing')
  const checks = [t('heroCheck1'), t('heroCheck2'), t('heroCheck3')]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-landing-navy via-landing-navy to-landing-blue">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-landing-cyan/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-6 py-24 lg:py-32">
        <p className="text-[11px] font-bold uppercase tracking-widest text-landing-cyan">{t('heroEyebrow')}</p>

        <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          {t('heroTitleLine1')}
          <br />
          <span className="text-landing-lime">{t('heroTitleLine2')}</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{t('heroSubtitle')}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-landing-lime px-6 py-3 text-sm font-semibold text-landing-navy transition hover:bg-landing-lime-dark hover:text-white"
          >
            {t('ctaSignUpLong')}
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {t('ctaSignIn')}
          </Link>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {checks.map((check) => (
            <li key={check} className="flex items-center gap-2 text-sm text-white/90">
              <CheckIcon className="h-4 w-4 shrink-0 text-landing-lime" />
              {check}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
