'use client'

import { useState, useTransition } from 'react'
import Papa from 'papaparse'
import { parseBaseOrders, type BaseCsvRow, type ImportRowError, type ParsedOrder } from '@/lib/domain/base-import'
import { importBaseOrders, type ImportLogEntry } from '../actions'

async function decodeCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('shift-jis').decode(buffer)
  }
}

const PREVIEW_ROW_COUNT = 20

export function ImportWizard() {
  const [rawRows, setRawRows] = useState<BaseCsvRow[]>([])
  const [orders, setOrders] = useState<ParsedOrder[]>([])
  const [parseErrors, setParseErrors] = useState<ImportRowError[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [importLog, setImportLog] = useState<ImportLogEntry[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setLoadError(null)
    setImportLog(null)
    setFileName(file.name)

    try {
      const text = await decodeCsvFile(file)
      const result = Papa.parse<BaseCsvRow>(text, { header: true, skipEmptyLines: true })
      const rows = result.data
      setRawRows(rows)

      const { orders: parsedOrders, errors } = parseBaseOrders(rows)
      setOrders(parsedOrders)
      setParseErrors(errors)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'CSVの読み込みに失敗しました。')
    } finally {
      setIsParsing(false)
    }
  }

  function handleImport() {
    startTransition(async () => {
      try {
        const { log } = await importBaseOrders(orders)
        setImportLog(log)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : '取込に失敗しました。')
      }
    })
  }

  const needsReviewCount = orders.filter((o) => o.needsReview).length
  const importedCount = importLog?.filter((l) => l.status === 'imported').length ?? 0
  const skippedCount = importLog?.filter((l) => l.status === 'skipped').length ?? 0
  const failedCount = importLog?.filter((l) => l.status === 'failed').length ?? 0

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">注文CSVファイル(Shift-JIS/UTF-8)</label>
        <input type="file" accept=".csv" onChange={handleFileChange} className="text-sm" />
        {fileName && <p className="mt-2 text-sm text-gray-500">{fileName}</p>}
        {isParsing && <p className="mt-2 text-sm text-gray-500">解析中...</p>}
        {loadError && <p className="mt-2 text-sm text-red-600">{loadError}</p>}
      </div>

      {rawRows.length > 0 && (
        <>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">サマリー</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryCard label="CSV行数" value={rawRows.length} />
              <SummaryCard label="注文数" value={orders.length} />
              <SummaryCard label="要確認注文数" value={needsReviewCount} accent={needsReviewCount > 0} />
              <SummaryCard label="解析エラー" value={parseErrors.length} accent={parseErrors.length > 0} />
            </div>
          </section>

          {parseErrors.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">検出された問題({parseErrors.length}件)</h2>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>
                    行{err.rowNumber}: {err.message}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              プレビュー(先頭{Math.min(PREVIEW_ROW_COUNT, rawRows.length)}行)
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-2 py-2">注文ID</th>
                    <th className="px-2 py-2">注文日時</th>
                    <th className="px-2 py-2">商品名</th>
                    <th className="px-2 py-2">バリエーション</th>
                    <th className="px-2 py-2">数量</th>
                    <th className="px-2 py-2">価格</th>
                    <th className="px-2 py-2">発送状況</th>
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, PREVIEW_ROW_COUNT).map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-2 py-1">{row['注文ID']}</td>
                      <td className="px-2 py-1">{row['注文日時']}</td>
                      <td className="px-2 py-1">{row['商品名']}</td>
                      <td className="px-2 py-1">{row['バリエーション']}</td>
                      <td className="px-2 py-1">{row['数量']}</td>
                      <td className="px-2 py-1">{row['価格']}</td>
                      <td className="px-2 py-1">{row['発送状況']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={isPending || orders.length === 0}
              onClick={handleImport}
              className="h-11 rounded-md bg-gray-900 px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? '取込中...' : '取込実行'}
            </button>
            {needsReviewCount > 0 && (
              <p className="text-sm text-amber-600">
                {needsReviewCount}件は取込後に実態確認が必要です(発送状況「便宜的な発送済」問題等)。
              </p>
            )}
          </div>
        </>
      )}

      {importLog && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">取込結果</h2>
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard label="取込済み" value={importedCount} />
            <SummaryCard label="スキップ(重複)" value={skippedCount} />
            <SummaryCard label="失敗" value={failedCount} accent={failedCount > 0} />
          </div>

          {needsReviewCount > 0 && (
            <a
              href="/admin/orders?source=base_import&production_status=completed"
              className="mt-3 inline-block rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
            >
              要確認の注文一覧を見る
            </a>
          )}

          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm">
            {importLog.map((entry, idx) => (
              <li
                key={idx}
                className={
                  entry.status === 'failed'
                    ? 'text-red-600'
                    : entry.status === 'skipped'
                      ? 'text-gray-400'
                      : 'text-gray-700'
                }
              >
                {entry.externalRef}: {entry.status}
                {entry.message ? ` (${entry.message})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
