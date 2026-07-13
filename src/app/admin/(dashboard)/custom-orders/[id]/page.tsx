import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCustomOrderInquiry, getCustomOrderThreads } from '@/lib/domain/custom-order'
import { getMediaSignedUrls } from '../actions'
import { StatusControl } from './_components/status-control'
import { MediaViewer } from './_components/media-viewer'

export const dynamic = 'force-dynamic'

const PAIN_AREA_LABELS: Record<string, string> = {
  thumb: '親指',
  index: '人差し指',
  middle: '中指',
  palm: '手のひら',
  wrist: '手首',
  shoulder: '肩・首',
}

// A-17詳細:回答・メディア閲覧・ステータス管理。往復履歴のタイムラインUIはTASK-37で拡張する。
export default async function CustomOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const inquiry = await getCustomOrderInquiry(supabase, params.id)
  if (!inquiry) notFound()

  const threads = await getCustomOrderThreads(supabase, inquiry.id)

  let preferredShapeName: string | null = null
  if (inquiry.answers.preferredShapeOptionValueId) {
    const { data } = await supabase
      .from('option_values')
      .select('name_ja')
      .eq('id', inquiry.answers.preferredShapeOptionValueId)
      .maybeSingle()
    preferredShapeName = (data?.name_ja as string | undefined) ?? null
  }

  const allAttachments = threads.flatMap((th) => th.attachments)
  const signedUrls = await getMediaSignedUrls(allAttachments.map((a) => a.path))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/custom-orders" className="text-sm text-gray-500 hover:underline">
          &larr; オーダーメイド申込一覧に戻る
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{inquiry.customer_name} 様のお申込み</h1>
          <StatusControl inquiryId={inquiry.id} currentStatus={inquiry.status} />
        </div>
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">お客様情報</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">メールアドレス</dt>
            <dd className="text-gray-900">{inquiry.customer_email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">言語</dt>
            <dd className="text-gray-900">{inquiry.locale === 'ja' ? '日本語' : 'English'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">申込日時</dt>
            <dd className="text-gray-900">{new Date(inquiry.created_at).toLocaleString('ja-JP')}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">質問票回答</h2>
        <dl className="space-y-3 text-sm">
          <Row label="主な使用用途" value={inquiry.answers.usagePurpose || '-'} />
          <Row label="1日の使用時間" value={inquiry.answers.dailyUsageHours || '-'} />
          <Row
            label="痛み・疲れの部位"
            value={
              inquiry.answers.painAreas.length > 0
                ? inquiry.answers.painAreas.map((code) => PAIN_AREA_LABELS[code] ?? code).join('、')
                : '-'
            }
          />
          <Row label="ペンだこの位置" value={inquiry.answers.callusLocation || '-'} />
          <Row label="好みのペン軸形状" value={preferredShapeName ?? '-'} />
          <Row label="その他ご希望" value={inquiry.answers.preferredShapeNote || '-'} />
          <Row label="使用ペン機種" value={inquiry.answers.penModel || '-'} />
        </dl>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">写真・動画</h2>
        {allAttachments.length === 0 ? (
          <p className="text-sm text-gray-500">添付がありません。</p>
        ) : (
          <MediaViewer attachments={allAttachments} signedUrls={signedUrls} />
        )}
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="whitespace-pre-wrap text-gray-900">{value}</dd>
    </div>
  )
}
