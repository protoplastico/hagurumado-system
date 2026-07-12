import Anthropic from '@anthropic-ai/sdk'
import type { EmailDraftInput, EmailDraft } from './types'

// TASK-12指示書は「claude-sonnet-4-6」を指定していたが実在しないモデルIDだったため、
// 現行の最新モデルに置き換え(要確認・報告済み。ユーザー承認によりclaude-sonnet-5を採用)。
const MODEL = 'claude-sonnet-5'

const TONE_GUIDE = `葉車堂細工所は木製ペングリップを一本ずつ手作業で仕上げる工房です。
メールの文体は以下を厳守してください:
- 丁寧語(です・ます調)を基本とし、過度にへりくだりすぎない
- 簡潔に。冗長な前置きや繰り返しを避ける
- 和の趣を感じさせる落ち着いた言葉選び(絵文字・過度な感嘆符は使わない)
- 顧客の氏名で始め、工房名(葉車堂細工所)で締める`

function buildPrompt(input: EmailDraftInput): string {
  const contextJson = JSON.stringify(input.context, null, 2)
  const localeInstruction = input.locale === 'en' ? '英語で作成してください。' : '日本語で作成してください。'

  return `あなたは木製ペングリップ工房「葉車堂細工所」のカスタマーサポート担当です。
以下の情報をもとに、顧客に送るメールの件名と本文を作成してください。

メール種別: ${input.type}
${localeInstruction}

${TONE_GUIDE}

差し込む情報(JSON):
${contextJson}

出力は必ず次のJSON形式のみで返してください。他の文章やMarkdownのコードフェンスは含めないでください。
{"subject": "件名", "body": "本文"}`
}

function extractJson(text: string): { subject?: unknown; body?: unknown } {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonText = fenced ? fenced[1] : trimmed
  return JSON.parse(jsonText)
}

export async function generateEmailDraftWithClaude(input: EmailDraftInput): Promise<EmailDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(input) }],
  })

  const textBlock = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  if (!textBlock) {
    throw new Error('Claude response did not include a text block')
  }

  const parsed = extractJson(textBlock.text)
  if (typeof parsed.subject !== 'string' || typeof parsed.body !== 'string') {
    throw new Error('Claude response is missing subject/body')
  }

  return { subject: parsed.subject, body: parsed.body }
}
