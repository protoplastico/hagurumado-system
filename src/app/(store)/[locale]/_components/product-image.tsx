import Image from 'next/image'

// TASK-29: priorityは商品詳細ページの主画像(LCP候補)のみtrueで渡す。一覧の
// カード画像(件数が多い)まで一律にpriority化するとかえってLCPを悪化させるため既定false。
export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  if (!src) {
    return (
      <div
        className={`flex aspect-square items-center justify-center bg-kinari-dark text-xs text-sumi/40 ${className}`}
      >
        No Image
      </div>
    )
  }

  return (
    <div className={`relative aspect-square overflow-hidden bg-kinari-dark ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" priority={priority} />
    </div>
  )
}
