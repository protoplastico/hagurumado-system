// TASK-23 S-09 / screen_design.md §5「状態表示の統一」に対応する顧客向け進捗ステージ。
// production_statusは工程の内部詳細(バッチ所属・検品等)を持つが、顧客表示は5段階に集約する。
export type CustomerProgressStage = 'received' | 'in_production' | 'preparing_shipment' | 'shipped' | 'delivered'

export const CUSTOMER_PROGRESS_STAGES: CustomerProgressStage[] = [
  'received',
  'in_production',
  'preparing_shipment',
  'shipped',
  'delivered',
]

const STAGE_RANK: Record<CustomerProgressStage, number> = {
  received: 0,
  in_production: 1,
  preparing_shipment: 2,
  shipped: 3,
  delivered: 4,
}

const PRODUCTION_STATUS_TO_STAGE: Record<string, CustomerProgressStage | undefined> = {
  received: 'received',
  queued: 'received',
  in_batch: 'in_production',
  inspected: 'preparing_shipment',
  ready_to_ship: 'preparing_shipment',
  shipped: 'shipped',
  completed: 'delivered',
}

// 注文単位の進捗=最も遅いアイテムに合わせる(指示書item4)。cancelledのアイテムは
// 個別キャンセルであり全体進捗を後退させるべきではないため集約対象から除外する。
// 対象アイテムが無い(全キャンセル等)場合はnullを返す。
export function aggregateOrderProgress(itemProductionStatuses: string[]): CustomerProgressStage | null {
  const stages = itemProductionStatuses
    .filter((s) => s !== 'cancelled')
    .map((s) => PRODUCTION_STATUS_TO_STAGE[s])
    .filter((s): s is CustomerProgressStage => s != null)

  if (stages.length === 0) return null

  return stages.reduce((slowest, s) => (STAGE_RANK[s] < STAGE_RANK[slowest] ? s : slowest))
}
