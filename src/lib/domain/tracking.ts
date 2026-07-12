import type { Carrier } from './shipping'

// TASK-23 S-09: クリックポスト/EMSはいずれも日本郵便の追跡システムで検索可能。
export function getTrackingUrl(carrier: Carrier, trackingNumber: string): string | null {
  switch (carrier) {
    case 'clickpost':
    case 'ems':
      return `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${encodeURIComponent(trackingNumber)}&locale=ja`
    case 'other':
      return null
  }
}
