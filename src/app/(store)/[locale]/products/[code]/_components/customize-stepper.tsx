'use client'

import { useMemo, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { formatPrice, getPriceForLocale } from '@/lib/domain/pricing'
import { buildOptionsSnapshot, getOptionDelta, type OptionsSnapshotEntry } from '@/lib/domain/options-snapshot'
import type { ProductDetail, ProductDetailOptionGroup } from '@/lib/domain/store-products'
import { PEN_MAKER_LABELS } from '@/lib/domain/enums'

type Props = {
  locale: Locale
  product: ProductDetail
  acceptingOrdersGlobal: boolean
}

export function CustomizeStepper({ locale, product, acceptingOrdersGlobal }: Props) {
  const dict = t(locale)
  const totalSteps = 1 + product.optionGroups.length + 1 // variation + option groups + summary
  const [step, setStep] = useState(0)
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null)
  const [selectedValueIds, setSelectedValueIds] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [addedToCart, setAddedToCart] = useState(false)

  const selectedVariation = product.variations.find((v) => v.id === selectedVariationId) ?? null

  const selections = useMemo(
    () =>
      product.optionGroups
        .map((group) => {
          const valueId = selectedValueIds[group.id]
          const value = group.values.find((v) => v.id === valueId)
          return value ? { group, value } : null
        })
        .filter((s): s is { group: ProductDetailOptionGroup; value: (typeof product.optionGroups)[number]['values'][number] } => s != null),
    [product, selectedValueIds]
  )

  const basePrice = getPriceForLocale(product, locale)
  const optionsTotal = selections.reduce((sum, s) => sum + getOptionDelta(s.value, locale), 0)
  const totalPrice = basePrice + optionsTotal

  const isVariationStep = step === 0
  const optionStepIndex = step - 1
  const isOptionStep = optionStepIndex >= 0 && optionStepIndex < product.optionGroups.length
  const isSummaryStep = step === totalSteps - 1
  const currentGroup = isOptionStep ? product.optionGroups[optionStepIndex] : null

  function canProceedFromCurrentStep(): boolean {
    if (isVariationStep) return selectedVariation != null
    if (currentGroup) {
      const valueId = selectedValueIds[currentGroup.id]
      if (currentGroup.is_required && !valueId) return false
      if (valueId) {
        const value = currentGroup.values.find((v) => v.id === valueId)
        if (value?.requires_note && !notes[currentGroup.id]?.trim()) return false
      }
      return true
    }
    return true
  }

  function handleNext() {
    if (!canProceedFromCurrentStep()) return
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const snapshot: OptionsSnapshotEntry[] = buildOptionsSnapshot(selections, locale)

  return (
    <div className="border border-sumi/10 bg-kinari-light p-5">
      {isVariationStep && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-sumi">{dict.productDetail.stepVariationHeading}</h2>
          {product.variations.length === 0 ? (
            <p className="text-sm text-sumi/60">{dict.productDetail.variationRequiredNotice}</p>
          ) : (
            <div className="space-y-2">
              {product.variations.map((variation) => {
                const name = locale === 'ja' ? variation.name_ja : variation.name_en
                const selected = selectedVariationId === variation.id
                return (
                  <button
                    key={variation.id}
                    type="button"
                    disabled={!variation.accepting_orders}
                    onClick={() => setSelectedVariationId(variation.id)}
                    className={`block w-full border px-4 py-3 text-left text-sm transition-colors ${
                      !variation.accepting_orders
                        ? 'cursor-not-allowed border-sumi/10 bg-kinari text-sumi/40'
                        : selected
                          ? 'border-accent bg-white text-sumi'
                          : 'border-sumi/20 bg-white text-sumi hover:border-accent'
                    }`}
                  >
                    <span>
                      [{PEN_MAKER_LABELS[variation.maker] ?? variation.maker}] {name}
                    </span>
                    {!variation.accepting_orders && (
                      <span className="ml-2 text-xs font-medium text-red-800">
                        {dict.productDetail.variationStopped}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {currentGroup && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-sumi">
            {locale === 'ja' ? currentGroup.name_ja : currentGroup.name_en}
          </h2>
          <p className="mb-3 text-xs text-sumi/50">
            {currentGroup.is_required ? dict.productDetail.optionRequiredMark : dict.productDetail.optionOptionalMark}
          </p>
          <div className="space-y-2">
            {currentGroup.values.map((value) => {
              const name = locale === 'ja' ? value.name_ja : value.name_en
              const delta = getOptionDelta(value, locale)
              const selected = selectedValueIds[currentGroup.id] === value.id
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() =>
                    setSelectedValueIds((prev) => ({
                      ...prev,
                      [currentGroup.id]: prev[currentGroup.id] === value.id ? '' : value.id,
                    }))
                  }
                  className={`block w-full border px-4 py-3 text-left text-sm transition-colors ${
                    selected ? 'border-accent bg-white text-sumi' : 'border-sumi/20 bg-white text-sumi hover:border-accent'
                  }`}
                >
                  {name}
                  {delta !== 0 && <span className="ml-2 text-xs text-accent">+{formatPrice(delta, locale)}</span>}
                </button>
              )
            })}
          </div>
          {selectedValueIds[currentGroup.id] &&
            currentGroup.values.find((v) => v.id === selectedValueIds[currentGroup.id])?.requires_note && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-sumi/70">{dict.productDetail.noteLabel}</label>
                <textarea
                  value={notes[currentGroup.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [currentGroup.id]: e.target.value }))}
                  placeholder={dict.productDetail.notePlaceholder}
                  rows={3}
                  className="w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi"
                />
                {!notes[currentGroup.id]?.trim() && (
                  <p className="mt-1 text-xs text-red-800">{dict.productDetail.noteRequiredError}</p>
                )}
              </div>
            )}
        </div>
      )}

      {isSummaryStep && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-sumi">{dict.productDetail.summaryHeading}</h2>
          <ul className="mb-4 space-y-1 text-sm text-sumi">
            <li>
              {selectedVariation ? (locale === 'ja' ? selectedVariation.name_ja : selectedVariation.name_en) : '-'}
            </li>
            {snapshot.map((entry, idx) => (
              <li key={idx} className="text-sumi/80">
                {entry.group}:{entry.value}
                {entry.delta !== 0 ? ` (+${formatPrice(entry.delta, locale)})` : ''}
              </li>
            ))}
          </ul>

          {!acceptingOrdersGlobal && (
            <p className="mb-3 border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs text-red-900">
              {dict.productDetail.globalStoppedNotice}
            </p>
          )}

          {addedToCart && (
            <p className="mb-3 border border-accent/30 bg-white px-3 py-2 text-xs text-sumi">
              {dict.productDetail.cartComingSoon}
            </p>
          )}

          <button
            type="button"
            disabled={!acceptingOrdersGlobal || !selectedVariation}
            onClick={() => setAddedToCart(true)}
            className="w-full border border-sumi/30 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {dict.productDetail.addToCart}
          </button>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-sumi/10 pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="text-sm text-sumi/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          {dict.productDetail.back}
        </button>
        <span className="text-sm font-medium text-sumi">
          {dict.productDetail.priceLabel}: {formatPrice(totalPrice, locale)}
        </span>
        {!isSummaryStep && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceedFromCurrentStep()}
            className="border border-sumi/30 px-5 py-2 text-sm text-sumi hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
          >
            {dict.productDetail.next}
          </button>
        )}
      </div>
    </div>
  )
}
