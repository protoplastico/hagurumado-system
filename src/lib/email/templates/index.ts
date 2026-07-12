import type { EmailDraftInput, EmailDraft } from '../types'
import { orderConfirmJa } from './order-confirm-ja'
import { orderConfirmEn } from './order-confirm-en'
import { productionStartJa } from './production-start-ja'
import { productionStartEn } from './production-start-en'
import { shippedJa } from './shipped-ja'
import { shippedEn } from './shipped-en'
import { delayJa } from './delay-ja'
import { delayEn } from './delay-en'

// Claude API失敗時のフォールバック用、変数差込式の静的テンプレート(4種×日英=8種)
export function getStaticTemplate(input: EmailDraftInput): EmailDraft {
  switch (input.type) {
    case 'order_confirm':
      return input.locale === 'en' ? orderConfirmEn(input.context) : orderConfirmJa(input.context)
    case 'production_start':
      return input.locale === 'en' ? productionStartEn(input.context) : productionStartJa(input.context)
    case 'shipped':
      return input.locale === 'en' ? shippedEn(input.context) : shippedJa(input.context)
    case 'delay':
      return input.locale === 'en' ? delayEn(input.context) : delayJa(input.context)
  }
}
