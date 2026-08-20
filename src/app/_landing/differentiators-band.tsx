import { getTranslations } from 'next-intl/server'

export async function DifferentiatorsBand() {
  const t = await getTranslations('Landing')

  const columns = [
    { title: t('why1Title'), body: t('why1Body') },
    { title: t('why2Title'), body: t('why2Body') },
    { title: t('why3Title'), body: t('why3Body') },
    { title: t('why4Title'), body: t('why4Body') },
  ]

  return (
    <section id="why" className="bg-landing-navy">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <p className="text-[11px] font-bold uppercase tracking-widest text-landing-cyan">{t('whyEyebrow')}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('whyTitle')}</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{t('whyIntro')}</p>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-semibold text-landing-lime">{column.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{column.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
