import { t, type Locale } from '@/lib/i18n'
import { CUSTOMER_PROGRESS_STAGES, type CustomerProgressStage } from '@/lib/domain/order-progress'

const STAGE_LABEL_KEYS: Record<CustomerProgressStage, 'progressReceived' | 'progressInProduction' | 'progressPreparingShipment' | 'progressShipped' | 'progressDelivered'> = {
  received: 'progressReceived',
  in_production: 'progressInProduction',
  preparing_shipment: 'progressPreparingShipment',
  shipped: 'progressShipped',
  delivered: 'progressDelivered',
}

// TASK-23 S-09: 生産ステータスの可視化(受付→製作中→発送準備中→発送済→お届け済)
export function OrderProgressBar({ locale, currentStage }: { locale: Locale; currentStage: CustomerProgressStage }) {
  const dict = t(locale)
  const currentIndex = CUSTOMER_PROGRESS_STAGES.indexOf(currentStage)

  return (
    <div className="flex items-center">
      {CUSTOMER_PROGRESS_STAGES.map((stage, idx) => {
        const done = idx <= currentIndex
        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full border ${done ? 'border-accent bg-accent' : 'border-sumi/30 bg-white'}`}
              />
              <p className={`mt-1 whitespace-nowrap text-[10px] ${done ? 'text-sumi' : 'text-sumi/40'}`}>
                {dict.account[STAGE_LABEL_KEYS[stage]]}
              </p>
            </div>
            {idx < CUSTOMER_PROGRESS_STAGES.length - 1 && (
              <div className={`mx-1 h-px flex-1 ${idx < currentIndex ? 'bg-accent' : 'bg-sumi/20'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
