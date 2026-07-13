import { sendGAEvent } from '@next/third-parties/google'

// TASK-29: GA4測定ID。人間がGA4プロパティ作成後にNEXT_PUBLIC_GA_MEASUREMENT_IDを設定する
// (SETUP.md参照)。未設定時はCookieバナー自体を表示せず、GAは一切読み込まれない。
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const GA_CONSENT_STORAGE_KEY = 'hagurumado_ga_consent'

export type GaConsent = 'unset' | 'granted' | 'denied'

// AnalyticsConsentコンポーネント(store layoutに1つだけマウント)がlocalStorageの読み込み・
// ボタン操作のたびに更新するモジュールレベルの状態。trackEvent()はReact外(イベントハンドラ)
// から呼ばれるため、Contextではなくこの単純な変数で同期する。
let consentState: GaConsent = 'unset'

export function setGaConsent(consent: GaConsent) {
  consentState = consent
}

export function getGaConsent(): GaConsent {
  return consentState
}

// TASK-29指示書:個人情報(氏名・住所・メール)をイベントパラメータに含めないこと。
// 呼び出し側は商品コード・数量・金額等の非個人情報のみを渡す。
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (consentState !== 'granted' || !GA_MEASUREMENT_ID) return
  sendGAEvent('event', name, params)
}
