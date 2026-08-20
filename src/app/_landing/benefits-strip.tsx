import { getTranslations } from 'next-intl/server'

export async function BenefitsStrip() {
  const t = await getTranslations('Landing')

  const items = [
    { title: t('benefit1Title'), body: t('benefit1Body') },
    { title: t('benefit2Title'), body: t('benefit2Body') },
    { title: t('benefit3Title'), body: t('benefit3Body') },
  ]

  return (
    <section className="border-b border-landing-line bg-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-16 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title}>
            <h3 className="text-base font-semibold text-landing-navy">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-landing-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
