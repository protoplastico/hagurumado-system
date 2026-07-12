import { t, type Locale } from '@/lib/i18n'

// TASK-24: 推定待ち週数の表示をS-01/S-02/S-03/S-05で共通化する。
export function WaitWeeksNotice({
  locale,
  estimatedWaitWeeks,
  className,
}: {
  locale: Locale
  estimatedWaitWeeks: number | null
  className?: string
}) {
  const dict = t(locale)

  const text =
    estimatedWaitWeeks != null
      ? [dict.status.waitWeeksPrefix, Math.ceil(estimatedWaitWeeks), dict.status.waitWeeksSuffix].join(
          locale === 'ja' ? '' : ' '
        )
      : dict.status.waitWeeksUnknown

  return <p className={className}>{text}</p>
}
