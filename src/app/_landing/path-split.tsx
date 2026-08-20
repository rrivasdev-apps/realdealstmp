import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function PathSplit() {
  const t = await getTranslations('Landing')

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight text-landing-navy sm:text-4xl">
          {t('pathTitle')}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-[18px] border border-landing-line bg-landing-soft p-8">
            <h3 className="text-xl font-semibold text-landing-navy">{t('pathSoloTitle')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-landing-muted">{t('pathSoloBody')}</p>
            <Link
              href="/signup"
              className="mt-6 inline-block text-sm font-semibold text-landing-blue hover:text-landing-navy"
            >
              {t('pathSoloLink')} →
            </Link>
          </div>

          <div className="rounded-[18px] bg-landing-navy p-8">
            <h3 className="text-xl font-semibold text-white">{t('pathTeamTitle')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{t('pathTeamBody')}</p>
            <Link href="/signup" className="mt-6 inline-block text-sm font-semibold text-landing-lime hover:text-white">
              {t('pathTeamLink')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
