'use client'

import { useState } from 'react'
import type { GripShapeOption } from '@/lib/domain/custom-order'
import { runDiagnosis, recordReplyAndDraft, sendProposal } from '../actions'

type Draft = {
  findings: string
  recommendedShapeOptionValueId: string | null
  recommendedShapeCustomNote: string
  proposalDraft: string
}

const EMPTY_DRAFT: Draft = { findings: '', recommendedShapeOptionValueId: null, recommendedShapeCustomNote: '', proposalDraft: '' }

// TASK-36: AIドラフト表示→職人が編集→「提案を送信」のみが送信経路(直接送信ボタンは存在しない)。
// 初回診断(写真+質問票)と、顧客返信を踏まえた差分整理ドラフトの両方をこのパネルで扱う
// (どちらも生成→編集→送信という同じ流れのため)。
export function DiagnosisPanel({ inquiryId, gripShapeOptions }: { inquiryId: string; gripShapeOptions: GripShapeOption[] }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [hasVideoOnly, setHasVideoOnly] = useState(false)
  const [replySummary, setReplySummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerateDiagnosis() {
    setError(null)
    setGenerating(true)
    setSent(false)
    try {
      const result = await runDiagnosis(inquiryId)
      setDraft(result)
      setHasVideoOnly(result.hasVideoOnly)
    } catch {
      setError('AI診断の生成に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateReplyDraft() {
    if (!replySummary.trim()) return
    setError(null)
    setGenerating(true)
    setSent(false)
    try {
      const result = await recordReplyAndDraft(inquiryId, replySummary.trim())
      setDraft(result)
      setReplySummary('')
    } catch {
      setError('返信案の生成に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend() {
    if (!draft.proposalDraft.trim()) return
    setError(null)
    setSending(true)
    try {
      await sendProposal({ inquiryId, proposalBody: draft.proposalDraft })
      setSent(true)
      setDraft(EMPTY_DRAFT)
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSending(false)
    }
  }

  const shapeLabel = gripShapeOptions.find((o) => o.id === draft.recommendedShapeOptionValueId)?.name_ja

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateDiagnosis}
          disabled={generating}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {generating ? '生成中...' : 'AI診断を生成(初回)'}
        </button>
      </div>

      {hasVideoOnly && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          動画のみが添付されており、動画はAI診断の解析対象外です(フレーム抽出は行いません)。写真情報のみで生成しています。
        </p>
      )}

      {(draft.findings || draft.proposalDraft) && (
        <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">所見(職人向け・非公開)</label>
            <textarea
              value={draft.findings}
              onChange={(e) => setDraft((d) => ({ ...d, findings: e.target.value }))}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">推奨形状</label>
            <select
              value={draft.recommendedShapeOptionValueId ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, recommendedShapeOptionValueId: e.target.value || null }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">(既存形状から選択なし)</option>
              {gripShapeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name_ja}
                </option>
              ))}
            </select>
            {shapeLabel && <p className="mt-1 text-xs text-gray-400">選択中: {shapeLabel}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">カスタム要素メモ</label>
            <textarea
              value={draft.recommendedShapeCustomNote}
              onChange={(e) => setDraft((d) => ({ ...d, recommendedShapeCustomNote: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">顧客向け提案文(この内容が送信されます)</label>
            <textarea
              value={draft.proposalDraft}
              onChange={(e) => setDraft((d) => ({ ...d, proposalDraft: e.target.value }))}
              rows={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.proposalDraft.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {sending ? '送信しています...' : '提案を送信'}
          </button>
        </div>
      )}

      {sent && <p className="text-sm text-green-700">提案を送信し、往復履歴に記録しました。</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-gray-500">顧客からの返信の要点(通常メールで受領した内容を記録)</label>
        <textarea
          value={replySummary}
          onChange={(e) => setReplySummary(e.target.value)}
          rows={3}
          placeholder="例:提案いただいた形状で問題ありません。納期の目安を教えてください。"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
        <button
          type="button"
          onClick={handleGenerateReplyDraft}
          disabled={generating || !replySummary.trim()}
          className="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          {generating ? '生成中...' : '記録してAI返信案を作成'}
        </button>
      </div>
    </div>
  )
}
