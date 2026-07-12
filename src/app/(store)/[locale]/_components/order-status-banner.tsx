import { t, type Locale } from '@/lib/i18n'
import type { OrderAcceptanceStatus } from '@/lib/domain/store-status'

export function OrderStatusBanner({ locale, status }: { locale: Locale; status: OrderAcceptanceStatus }) {
  const dict = t(locale)

  const waitWeeksText =
    status.estimatedWaitWeeks != null
      ? [dict.status.waitWeeksPrefix, Math.ceil(status.estimatedWaitWeeks), dict.status.waitWeeksSuffix].join(
          locale === 'ja' ? '' : ' '
        )
      : dict.status.waitWeeksUnknown

  return (
    <div
      className={`w-full border-b px-4 py-3 text-center text-sm ${
        status.acceptingOrders
          ? 'border-accent/30 bg-kinari-light text-sumi'
          : 'border-red-900/20 bg-red-900/5 text-red-900'
      }`}
    >
      <p className="font-medium">
        {status.acceptingOrders ? dict.status.acceptingTrue : dict.status.acceptingFalse}
      </p>
      <p className="mt-0.5 text-xs opacity-80">{waitWeeksText}</p>
    </div>
  )
}
