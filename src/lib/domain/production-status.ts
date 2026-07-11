export type ProductionStatus =
  | 'received'
  | 'queued'
  | 'in_batch'
  | 'inspected'
  | 'ready_to_ship'
  | 'shipped'
  | 'completed'
  | 'cancelled'

// screen_design.md §5「状態表示の統一」準拠
export const PRODUCTION_STATUS_LABELS_ADMIN: Record<ProductionStatus, string> = {
  received: '受付/キュー待ち',
  queued: '受付/キュー待ち',
  in_batch: '製作中',
  inspected: '検品済/発送準備',
  ready_to_ship: '検品済/発送準備',
  shipped: '発送済',
  completed: '完了',
  cancelled: 'キャンセル',
}

export const PRODUCTION_STATUS_LABELS_CUSTOMER: Record<ProductionStatus, string> = {
  received: 'ご注文受付',
  queued: 'ご注文受付',
  in_batch: '製作中',
  inspected: '発送準備中',
  ready_to_ship: '発送準備中',
  shipped: '発送済(追跡)',
  completed: 'お届け済',
  cancelled: 'キャンセル',
}
