import Link from 'next/link'

// Shared shell for /login and /signup -- the pre-account funnel a visitor
// reaches from the landing page, so it picks up the same navy/blue/lime
// palette as src/app/_landing/ rather than the authenticated app's purple
// --brand-* tokens (see src/app/globals.css).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // shrink-0 matters: the root layout's <body> is itself `flex flex-col`
    // with a definite (h-full) height, so this div is body's flex *item* --
    // and an authored min-height (min-h-screen) silences the automatic
    // content-protection min-size flex items normally get, letting body
    // shrink this div back down to its own fixed box. That clipped the
    // background at the viewport edge on a tall form (signup) even though
    // min-h-screen "should" have floored it taller. shrink-0 stops body from
    // compressing it, so height is just content, floored at min-h-screen for
    // short pages (login).
    <div className="min-h-screen shrink-0 bg-landing-soft">
      <header className="border-b border-landing-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-landing-navy">
            Real<span className="text-landing-blue">Deals</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-[18px] border border-landing-line bg-white p-8 shadow-sm">{children}</div>
      </main>
    </div>
  )
}
