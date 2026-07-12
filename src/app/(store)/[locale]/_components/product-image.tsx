import Image from 'next/image'

export function ProductImage({
  src,
  alt,
  className = '',
}: {
  src: string | null
  alt: string
  className?: string
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
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />
    </div>
  )
}
