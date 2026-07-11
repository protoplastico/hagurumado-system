export function WoodSpeciesPanel({
  woodSpeciesList,
  selected,
}: {
  woodSpeciesList: { species: string; count: number }[]
  selected?: string
}) {
  return (
    <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">樹種別滞留数</h2>
      <nav className="space-y-1">
        <a
          href="/admin/queue"
          className={`block rounded-md px-3 py-2 text-sm ${
            !selected ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          すべて
        </a>
        {woodSpeciesList.map((row) => (
          <a
            key={row.species}
            href={`/admin/queue?wood_species=${encodeURIComponent(row.species)}`}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
              selected === row.species ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{row.species}</span>
            <span>{row.count}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}
