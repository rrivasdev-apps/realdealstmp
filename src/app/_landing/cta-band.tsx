import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function CtaBand() {
  const t = await getTranslations('Landing')

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <p className="text-2xl font-semibold leading-snug text-landing-navy sm:text-3xl">{t('quoteText')}</p>
          <p className="mt-4 text-base text-landing-muted">{t('quoteSubtext')}</p>
        </div>
      </section>

      <section className="bg-landing-cyan">
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-landing-navy/70">{t('ctaEyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-landing-navy sm:text-4xl">{t('ctaTitle')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-landing-navy/80">{t('ctaBody')}</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-landing-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-landing-ink"
          >
            {t('ctaSignUpLong')}
          </Link>
        </div>
      </section>
    </>
  )
}
