import { getTranslations } from 'next-intl/server'

import {
  FileSpreadsheetIcon,
  RouteIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersRoundIcon,
  WorkflowIcon,
} from '@/components/icons'

// Tailwind's scanner needs full literal class names, not interpolated ones
// (`border-${accent}` is invisible to it) -- so this is a lookup of complete
// strings, not a fragment to interpolate.
const ACCENT_BORDERS = [
  'border-landing-lime',
  'border-landing-blue',
  'border-landing-cyan',
  'border-landing-lime',
  'border-landing-blue',
  'border-landing-cyan',
] as const

export async function FeatureGrid() {
  const t = await getTranslations('Landing')

  const features = [
    { Icon: RouteIcon, tag: t('featureWhiteboardTag'), title: t('featureWhiteboardTitle'), body: t('featureWhiteboardBody') },
    { Icon: FileSpreadsheetIcon, tag: t('featureFinancialTag'), title: t('featureFinancialTitle'), body: t('featureFinancialBody') },
    { Icon: UsersRoundIcon, tag: t('featureContactsTag'), title: t('featureContactsTitle'), body: t('featureContactsBody') },
    { Icon: WorkflowIcon, tag: t('featureAutomationsTag'), title: t('featureAutomationsTitle'), body: t('featureAutomationsBody') },
    { Icon: TargetIcon, tag: t('featureKpiTag'), title: t('featureKpiTitle'), body: t('featureKpiBody') },
    { Icon: ShieldCheckIcon, tag: t('featureTeamTag'), title: t('featureTeamTitle'), body: t('featureTeamBody') },
  ]

  return (
    <section id="features" className="bg-landing-soft">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <p className="text-[11px] font-bold uppercase tracking-widest text-landing-lime-dark">{t('featuresEyebrow')}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-landing-navy sm:text-4xl">
          {t('featuresTitle')}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-landing-muted">{t('featuresIntro')}</p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, tag, title, body }, index) => (
            <div
              key={title}
              className={`rounded-[14px] border-t-4 ${ACCENT_BORDERS[index]} bg-white p-6 shadow-sm`}
            >
              <Icon className="h-6 w-6 text-landing-blue" />
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-landing-muted">{tag}</p>
              <h3 className="mt-1 text-lg font-semibold text-landing-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
