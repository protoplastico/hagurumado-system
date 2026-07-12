import { t, type Locale } from '@/lib/i18n'
import { PEN_MAKER_VALUES, PRODUCT_SERIES_VALUES } from '@/lib/domain/enums'

type Defaults = {
  maker?: string
  series?: string
  minPrice?: string
  maxPrice?: string
}

// GETフォームのみでURLクエリと同期(JS不要)。admin/orders/_components/order-filters.tsxと同じ方針。
export function ProductFilters({ locale, defaults }: { locale: Locale; defaults: Defaults }) {
  const dict = t(locale)

  return (
    <form
      method="get"
      className="grid grid-cols-1 gap-3 border border-sumi/10 bg-kinari-light p-4 text-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <div>
        <label className="mb-1 block text-xs text-sumi/70">{dict.productList.filterMaker}</label>
        <select
          name="maker"
          defaultValue={defaults.maker ?? ''}
          className="w-full rounded-sm border border-sumi/20 bg-white px-2 py-2 text-sumi"
        >
          <option value="">{dict.productList.filterAll}</option>
          {PEN_MAKER_VALUES.map((v) => (
            <option key={v} value={v}>
              {dict.maker[v]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-sumi/70">{dict.productList.filterSeries}</label>
        <select
          name="series"
          defaultValue={defaults.series ?? ''}
          className="w-full rounded-sm border border-sumi/20 bg-white px-2 py-2 text-sumi"
        >
          <option value="">{dict.productList.filterAll}</option>
          {PRODUCT_SERIES_VALUES.map((v) => (
            <option key={v} value={v}>
              {dict.series[v]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-sumi/70">{dict.productList.filterMinPrice}</label>
        <input
          type="number"
          name="minPrice"
          min={0}
          defaultValue={defaults.minPrice}
          className="w-full rounded-sm border border-sumi/20 bg-white px-2 py-2 text-sumi"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-sumi/70">{dict.productList.filterMaxPrice}</label>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={defaults.maxPrice}
          className="w-full rounded-sm border border-sumi/20 bg-white px-2 py-2 text-sumi"
        />
      </div>

      <div className="flex items-end gap-2">
        <button type="submit" className="h-10 flex-1 border border-sumi/30 px-4 text-sumi hover:border-accent">
          {dict.productList.apply}
        </button>
        <a
          href={`/${locale}/products`}
          className="flex h-10 items-center border border-sumi/10 px-3 text-xs text-sumi/60 hover:text-accent"
        >
          {dict.productList.reset}
        </a>
      </div>
    </form>
  )
}
