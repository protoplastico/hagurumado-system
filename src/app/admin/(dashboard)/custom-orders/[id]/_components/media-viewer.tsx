type Attachment = { path: string; kind: 'image' | 'video' }

// 署名付きURL(1時間有効)のみを使う。公開URLは発行しない(TASK-35受入条件)。
export function MediaViewer({ attachments, signedUrls }: { attachments: Attachment[]; signedUrls: Record<string, string> }) {
  if (attachments.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {attachments.map((att) => {
        const url = signedUrls[att.path]
        if (!url) return null
        return (
          <div key={att.path} className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
            {att.kind === 'video' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video controls src={url} className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-contain" />
            )}
          </div>
        )
      })}
    </div>
  )
}
