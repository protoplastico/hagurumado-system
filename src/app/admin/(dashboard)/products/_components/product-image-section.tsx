'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeProductImage, uploadProductImage } from '../actions'

export function ProductImageSection({ productId, imageUrl }: { productId: string; imageUrl: string | null }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      await uploadProductImage(productId, formData)
      formRef.current?.reset()
      router.refresh()
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeProductImage(productId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="商品画像" className="h-32 w-32 rounded object-cover" />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          画像未設定
        </div>
      )}
      <div className="space-y-2">
        <form ref={formRef} action={handleUpload} className="flex items-center gap-2">
          <input type="file" name="file" accept="image/*" required className="text-sm" />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            アップロード
          </button>
        </form>
        {imageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="text-xs text-red-700 disabled:opacity-40"
          >
            画像を削除
          </button>
        )}
      </div>
    </div>
  )
}
