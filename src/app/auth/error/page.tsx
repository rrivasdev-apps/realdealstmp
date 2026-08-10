import { getTranslations } from 'next-intl/server'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const t = await getTranslations('Auth')

  return (
    <div className="mx-auto max-w-sm py-24 text-center">
      <h1 className="heading-page">{t('errorTitle')}</h1>
      <p className="mt-2 text-muted-foreground">
        {error ?? t('invalidLink')}
      </p>
    </div>
  )
}
