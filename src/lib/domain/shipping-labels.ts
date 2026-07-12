import Encoding from 'encoding-japanese'

// クリックポスト「まとめ申込」CSV仕様(2026-07-12時点、複数の独立した実装解説記事で確認。
// 日本郵便公式PDFへの直接アクセスがネットワーク制限で不可だったため、実際の一括申込前に
// クリックポスト公式サイトの最新テンプレートと突き合わせて確認すること):
//   A列 お届け先郵便番号(必須、ハイフン無し7桁 or ハイフン有り8桁)
//   B列 お届け先氏名(必須、敬称除き全角20/半角40文字以内)
//   C列 お届け先敬称(「様」または「御中」。氏名ありなら「様」)
//   D-G列 お届け先住所1〜4行目(1行20文字まで、いずれか必須。余りは空欄)
//   H列 内容品
// 文字コードはANSIまたはShift-JIS指定(UTF-8だと文字化けして取込エラーになる)。最大40件/回。
// 出典: https://note.com/toraowork/n/n6722c2ae4f61 ,
//       https://matchachalife.com/クリックポスト-で「まとめ申込」を利用してみる/ 等

export type ClickpostOrderInput = {
  orderNumber: string
  shipName: string
  shipPostal: string
  shipAddress1: string
  shipAddress2: string | null
}

export type EmsOrderInput = {
  orderNumber: string
  shipName: string
  shipPostal: string
  shipAddress1: string
  shipAddress2: string | null
  shipCountry: string | null
  shipPhone: string | null
}

const CLICKPOST_ADDRESS_LINES = 4
const CLICKPOST_MAX_CHARS_PER_LINE = 20
export const CLICKPOST_MAX_BATCH_SIZE = 40

function chunkAddress(fullAddress: string, maxLines: number, maxCharsPerLine: number): string[] {
  const lines: string[] = []
  let remaining = fullAddress.trim()
  while (remaining.length > 0 && lines.length < maxLines) {
    lines.push(remaining.slice(0, maxCharsPerLine))
    remaining = remaining.slice(maxCharsPerLine)
  }
  while (lines.length < maxLines) lines.push('')
  return lines
}

function normalizePostalCode(postal: string): string {
  const digits = postal.replace(/[^0-9]/g, '')
  if (digits.length === 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return postal
}

export function buildClickpostRows(orders: ClickpostOrderInput[]): string[][] {
  return orders.map((order) => {
    const fullAddress = [order.shipAddress1, order.shipAddress2].filter(Boolean).join(' ')
    const addressLines = chunkAddress(fullAddress, CLICKPOST_ADDRESS_LINES, CLICKPOST_MAX_CHARS_PER_LINE)
    return [normalizePostalCode(order.shipPostal), order.shipName, '様', ...addressLines, '木製ペングリップ']
  })
}

// EMS(海外発送)分は日本郵便の一括申込CSV仕様が公開されていないため汎用形式とする
// (注文番号/氏名/郵便番号/住所/国/電話番号を並べた、手作業での宛名記入・追跡番号記録用の一覧)。
export function buildEmsRows(orders: EmsOrderInput[]): string[][] {
  return orders.map((order) => [
    order.orderNumber,
    order.shipName,
    order.shipPostal,
    [order.shipAddress1, order.shipAddress2].filter(Boolean).join(' '),
    order.shipCountry ?? '',
    order.shipPhone ?? '',
  ])
}

export const EMS_HEADER_ROW = ['注文番号', '氏名', '郵便番号', '住所', '国', '電話番号']

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function rowsToCsvText(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
}

export function csvTextToBlob(text: string, encoding: 'utf-8' | 'shift-jis'): Blob {
  if (encoding === 'utf-8') {
    // Excelでの文字化け防止のためBOM付与
    return new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
  }
  const unicodeArray = Encoding.stringToCode(text)
  const sjisArray = Encoding.convert(unicodeArray, { to: 'SJIS', from: 'UNICODE' })
  return new Blob([new Uint8Array(sjisArray)], { type: 'text/csv' })
}
