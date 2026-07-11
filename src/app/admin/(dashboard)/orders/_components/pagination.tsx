type Props = {
  page: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

export function Pagination({ page, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null

  function hrefForPage(targetPage: number): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || !value) continue
      params.set(key, value)
    }
    params.set('page', String(targetPage))
    return `/admin/orders?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <a
        href={page > 1 ? hrefForPage(page - 1) : undefined}
        aria-disabled={page <= 1}
        className={`rounded-md border border-gray-300 px-4 py-2 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
      >
        前へ
      </a>
      <span className="text-gray-500">
        {page} / {totalPages}
      </span>
      <a
        href={page < totalPages ? hrefForPage(page + 1) : undefined}
        aria-disabled={page >= totalPages}
        className={`rounded-md border border-gray-300 px-4 py-2 ${
          page >= totalPages ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        次へ
      </a>
    </div>
  )
}
