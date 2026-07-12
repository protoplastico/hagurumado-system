import { t, type Locale } from '@/lib/i18n'
import type { OrderAcceptanceStatus } from '@/lib/domain/store-status'
import { WaitWeeksNotice } from './wait-weeks-notice'

export function OrderStatusBanner({ locale, status }: { locale: Locale; status: OrderAcceptanceStatus }) {
  const dict = t(locale)

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
      <WaitWeeksNotice locale={locale} estimatedWaitWeeks={status.estimatedWaitWeeks} className="mt-0.5 text-xs opacity-80" />
    </div>
  )
}
