import Anthropic from '@anthropic-ai/sdk'
import { TONE_GUIDE } from '@/lib/email/claude-draft'
import type { CustomOrderAnswers, GripShapeOption } from '@/lib/domain/custom-order'
import type { Locale } from '@/lib/i18n'

// TASK-36: メール基盤(src/lib/email/claude-draft.ts)と同じclaude-sonnet-5+トーンガイドを使う。
const MODEL = 'claude-sonnet-5'

export type DiagnosisDraft = {
  findings: string
  recommendedShapeOptionValueId: string | null
  recommendedShapeCustomNote: string
  proposalDraft: string
}

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1] : trimmed
  return JSON.parse(jsonText)
}

function toDiagnosisDraft(parsed: Record<string, unknown>): DiagnosisDraft {
  return {
    findings: typeof parsed.findings === 'string' ? parsed.findings : '',
    recommendedShapeOptionValueId:
      typeof parsed.recommendedShapeOptionValueId === 'string' && parsed.recommendedShapeOptionValueId.length > 0
        ? parsed.recommendedShapeOptionValueId
        : null,
    recommendedShapeCustomNote: typeof parsed.recommendedShapeCustomNote === 'string' ? parsed.recommendedShapeCustomNote : '',
    proposalDraft: typeof parsed.proposalDraft === 'string' ? parsed.proposalDraft : '',
  }
}

const OUTPUT_FORMAT_INSTRUCTION = `出力は必ず次のJSON形式のみで返してください。他の文章やMarkdownのコードフェンスは含めないでください。
{"findings": "所見(握り方の特徴・負荷部位の推定。職人向けの日本語で簡潔に)", "recommendedShapeOptionValueId": "既存グリップ形状一覧のIDから最も近いもの、またはnull", "recommendedShapeCustomNote": "既存形状だけでは対応しきれないカスタム要素の説明(なければ空文字)", "proposalDraft": "顧客向け提案文ドラフト"}`

const DIAGNOSIS_CONSTRAINTS = `【重要な制約】
- あなたの所見・提案はこのまま顧客に送られることはなく、必ず職人が確認・編集してから送信されます(あなたが直接送信することはありません)。
- 医学的な断定表現(例:「腱鞘炎です」)は禁止です。「〜の傾向が見られます」「〜と推測されます」など、観察に基づく柔らかい表現にしてください。
- 推奨形状は、渡された既存グリップ形状一覧から最も近いものを1つ選んでください。既存の形状だけでは対応しきれない場合のみ、recommendedShapeCustomNoteにカスタム要素を記述してください。`

export type DiagnoseInput = {
  locale: Locale
  answers: CustomOrderAnswers
  imageUrls: string[]
  hasVideoOnly: boolean
  gripShapeOptions: GripShapeOption[]
}

// TASK-36: 質問票回答+持ち方写真から一次診断ドラフトを生成する。動画はフレーム抽出せず対象外
// (呼び出し側でimageUrlsから除外し、hasVideoOnlyで職人向けに「動画は解析対象外」を伝える)。
export async function generateDiagnosisDraft(input: DiagnoseInput): Promise<DiagnosisDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const client = new Anthropic({ apiKey })
  const shapesList = input.gripShapeOptions.map((o) => `- ${o.id}: ${o.name_ja}`).join('\n')
  const localeInstruction =
    input.locale === 'en'
      ? 'proposalDraftは英語で作成してください。findings・recommendedShapeCustomNoteは職人向けのため日本語のままで構いません。'
      : '全て日本語で作成してください。'

  const promptText = `あなたは木製ペングリップ工房「葉車堂細工所」でオーダーメイド品の一次診断ドラフトを作成するアシスタントです。
以下の質問票回答と、お客様がペンを持っている状態の写真をもとに、診断ドラフトを作成してください。
${input.hasVideoOnly ? '\n(注:動画のみが提出されており、動画はこの診断では解析対象外です。写真情報のみで診断してください。)\n' : ''}
${DIAGNOSIS_CONSTRAINTS}

質問票回答:
主な使用用途: ${input.answers.usagePurpose || '(未回答)'}
1日の使用時間: ${input.answers.dailyUsageHours || '(未回答)'}
痛み・疲れの部位: ${input.answers.painAreas.join('、') || '(未回答)'}
ペンだこの位置: ${input.answers.callusLocation || '(未回答)'}
お客様希望の軸形状メモ: ${input.answers.preferredShapeNote || '(未回答)'}
使用ペン機種: ${input.answers.penModel || '(未回答)'}

既存グリップ形状一覧:
${shapesList || '(取得できませんでした)'}

${localeInstruction}
${TONE_GUIDE}

${OUTPUT_FORMAT_INSTRUCTION}`

  const imageBlocks: Anthropic.ImageBlockParam[] = input.imageUrls.map((url) => ({
    type: 'image',
    source: { type: 'url', url },
  }))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: promptText }] }],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock) throw new Error('Claude response did not include a text block')

  return toDiagnosisDraft(extractJson(textBlock.text))
}

export type ReplyDraftInput = {
  locale: Locale
  answers: CustomOrderAnswers
  previousProposal: string
  customerReplySummary: string
  gripShapeOptions: GripShapeOption[]
}

// TASK-36項目3:顧客返信(メールで受領、職人が要点をA-17に記録したもの)をもとに、
// 修正提案または受注確定案内のドラフトを生成する。診断と同じ「職人レビュー必須」制約を適用する。
export async function generateReplyDraft(input: ReplyDraftInput): Promise<DiagnosisDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const client = new Anthropic({ apiKey })
  const shapesList = input.gripShapeOptions.map((o) => `- ${o.id}: ${o.name_ja}`).join('\n')
  const localeInstruction = input.locale === 'en' ? 'proposalDraftは英語で作成してください。' : '全て日本語で作成してください。'

  const promptText = `あなたは木製ペングリップ工房「葉車堂細工所」でオーダーメイド品のやり取りを整理するアシスタントです。
これまでの提案内容と、それに対する顧客からの返信の要点(職人がメールを見て記録したもの)をもとに、
次に送る返信のドラフトを作成してください。顧客が追加の要望を伝えている場合は修正提案を、
特に異論なく承諾している様子であれば受注に向けた確認案内を作成してください。

${DIAGNOSIS_CONSTRAINTS}

これまでの質問票回答:
主な使用用途: ${input.answers.usagePurpose || '(未回答)'}
痛み・疲れの部位: ${input.answers.painAreas.join('、') || '(未回答)'}
使用ペン機種: ${input.answers.penModel || '(未回答)'}

これまでの提案文:
${input.previousProposal}

顧客からの返信の要点(職人記録):
${input.customerReplySummary}

既存グリップ形状一覧:
${shapesList || '(取得できませんでした)'}

${localeInstruction}
${TONE_GUIDE}

${OUTPUT_FORMAT_INSTRUCTION}`

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: promptText }],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  if (!textBlock) throw new Error('Claude response did not include a text block')

  return toDiagnosisDraft(extractJson(textBlock.text))
}
