import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { formatPrice } from '@/lib/domain/pricing'
import type { CartItem } from '@/lib/store/cart'
import type { CartRecalcResult } from '../actions'

export function CartLineItem({
  locale,
  item,
  recalc,
  onRemove,
  onQuantityChange,
}: {
  locale: Locale
  item: CartItem
  recalc: CartRecalcResult | undefined
  onRemove: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
}) {
  const dict = t(locale)

  if (!recalc || !recalc.found) {
    return (
      <div className="border border-red-900/20 bg-red-900/5 p-4 text-sm">
        <p className="text-red-900">{dict.cart.unavailableNotice}</p>
        <button type="button" onClick={() => onRemove(item.id)} className="mt-2 text-xs text-sumi/60 underline">
          {dict.cart.remove}
        </button>
      </div>
    )
  }

  const optionsDelta =
    locale === 'ja'
      ? recalc.options.reduce((sum, o) => sum + o.deltaDomestic, 0)
      : recalc.options.reduce((sum, o) => sum + o.deltaInternational, 0)
  const currentUnitPrice = (locale === 'ja' ? recalc.priceDomestic : recalc.priceInternational) + optionsDelta
  const addedUnitPrice = locale === 'ja' ? item.addedPriceDomestic : item.addedPriceInternational
  const priceChanged = currentUnitPrice !== addedUnitPrice

  const isBlocked = !recalc.productActive || recalc.variationAccepting === false
  const productName = locale === 'ja' ? recalc.productNameJa : recalc.productNameEn
  const variationName = locale === 'ja' ? recalc.variationNameJa : recalc.variationNameEn

  return (
    <div className={`border p-4 ${isBlocked ? 'border-red-900/30 bg-red-900/5' : 'border-sumi/10 bg-kinari-light'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/${locale}/products/${recalc.productCode}`} className="text-sm font-medium text-sumi hover:text-accent">
            {productName}
          </Link>
          {variationName && <p className="mt-1 text-xs text-sumi/70">{variationName}</p>}
          <ul className="mt-1 space-y-0.5 text-xs text-sumi/60">
            {recalc.options.map((o, idx) => {
              const groupName = locale === 'ja' ? o.groupNameJa : o.groupNameEn
              const valueName = locale === 'ja' ? o.valueNameJa : o.valueNameEn
              const delta = locale === 'ja' ? o.deltaDomestic : o.deltaInternational
              // recalculateCart()はitem.optionsのvalueId順に結果を並べ直すため、同じindexで対応する
              const note = item.options[idx]?.note
              return (
                <li key={idx}>
                  {groupName}:{valueName}
                  {delta !== 0 ? ` (+${formatPrice(delta, locale)})` : ''}
                  {note && <span className="block text-sumi/50">{dict.cart.noteLabel}: {note}</span>}
                </li>
              )
            })}
          </ul>
        </div>
        <button type="button" onClick={() => onRemove(item.id)} className="shrink-0 text-xs text-sumi/50 hover:text-red-800">
          {dict.cart.remove}
        </button>
      </div>

      {isBlocked && (
        <p className="mt-2 text-xs font-medium text-red-900">{dict.cart.variationStoppedNotice}</p>
      )}
      {priceChanged && !isBlocked && (
        <p className="mt-2 text-xs font-medium text-amber-800">{dict.cart.priceChangedNotice}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-sumi/70">
          {dict.cart.quantity}
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => onQuantityChange(item.id, Number(e.target.value))}
            className="w-16 border border-sumi/20 bg-white px-2 py-1 text-sm text-sumi"
          />
        </label>
        <span className="text-sm font-medium text-sumi">{formatPrice(currentUnitPrice * item.quantity, locale)}</span>
      </div>
    </div>
  )
}
