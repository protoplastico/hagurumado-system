import type { CustomOrderThreadEntry } from '@/lib/domain/custom-order'

const PAIN_AREA_LABELS: Record<string, string> = {
  thumb: '親指',
  index: '人差し指',
  middle: '中指',
  palm: '手のひら',
  wrist: '手首',
  shoulder: '肩・首',
}

type ParsedAnswers = {
  usagePurpose?: string
  dailyUsageHours?: string
  painAreas?: string[]
  callusLocation?: string
  preferredShapeNote?: string
  penModel?: string
}

function tryParseAnswers(body: string): ParsedAnswers | null {
  try {
    const parsed = JSON.parse(body)
    if (parsed && typeof parsed === 'object' && 'usagePurpose' in parsed) return parsed as ParsedAnswers
    return null
  } catch {
    return null
  }
}

function entryLabel(entry: CustomOrderThreadEntry, isFirst: boolean): string {
  if (isFirst && entry.direction === 'inbound') return '質問票回答(申込時)'
  if (entry.direction === 'outbound') return entry.ai_draft ? 'AI所見・提案(職人確認済み)' : '送信'
  return '顧客からの返信(職人記録)'
}

// TASK-37項目2: 質問票→AI所見→提案→返信→確定を時系列表示する。
// 最初のエントリ(申込時の質問票JSON)だけは特別にパースして読みやすく整形する。
export function Timeline({ threads }: { threads: CustomOrderThreadEntry[] }) {
  if (threads.length === 0) {
    return <p className="text-sm text-gray-500">まだ往復履歴がありません。</p>
  }

  return (
    <ol className="space-y-4">
      {threads.map((entry, idx) => {
        const isFirst = idx === 0
        const parsedAnswers = isFirst ? tryParseAnswers(entry.body) : null

        return (
          <li key={entry.id} className="border-l-2 border-gray-300 pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  entry.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {entryLabel(entry, isFirst)}
              </span>
              <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString('ja-JP')}</span>
              {entry.attachments.length > 0 && (
                <span className="text-xs text-gray-400">添付{entry.attachments.length}件</span>
              )}
            </div>

            {parsedAnswers ? (
              <dl className="mt-2 space-y-1 text-sm text-gray-800">
                <p>用途: {parsedAnswers.usagePurpose || '-'}</p>
                <p>使用時間: {parsedAnswers.dailyUsageHours || '-'}</p>
                <p>
                  痛み・疲れの部位:{' '}
                  {(parsedAnswers.painAreas ?? []).map((c) => PAIN_AREA_LABELS[c] ?? c).join('、') || '-'}
                </p>
                <p>ペンだこの位置: {parsedAnswers.callusLocation || '-'}</p>
                <p>ペン機種: {parsedAnswers.penModel || '-'}</p>
              </dl>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{entry.body}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
