import { BenefitsStrip } from './benefits-strip'
import { CtaBand } from './cta-band'
import { DifferentiatorsBand } from './differentiators-band'
import { FeatureGrid } from './feature-grid'
import { LandingFooter } from './footer'
import { LandingHeader } from './header'
import { LandingHero } from './hero'
import { PathSplit } from './path-split'

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <BenefitsStrip />
        <FeatureGrid />
        <PathSplit />
        <DifferentiatorsBand />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  )
}
