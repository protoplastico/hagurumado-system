# 葉車堂細工所 横須賀 — 受注・生産・納品 一元管理システム

## プロジェクト概要
木製ペングリップの受注生産工房の業務管理システム+ECサイト。
中核は**業務管理**(受注→樹種別バッチ生産→発送)であり、販売フロントは後続フェーズ。
設計の根拠は `docs/` の4文書。**実装前に必ず該当箇所を読むこと。**

- `docs/hagurumado_requirements.md` — 要件定義書v2.0(業務プロセス定義が中核)
- `docs/db_design.md` — DB設計書v1.0(テーブル・ENUM・ビュー・RLS)
- `docs/screen_design.md` — 画面設計書v1.0(A系=管理、S系=フロント)
- `docs/base_structure_research.md` — 移行元BASEの構造調査

## 技術スタック
- Next.js 14(App Router)+ TypeScript(strict)
- Supabase(PostgreSQL 15 + Auth + Storage)
- Tailwind CSS
- デプロイ:Vercel

## 作業ルール
1. `tasks/phase1/` のタスクを**番号順に1つずつ**完了させる。並行着手しない
2. 各タスク完了時:`npm run typecheck && npm run lint` を通し、タスクファイル末尾の受入条件を自己検証してからコミット
3. コミットメッセージ:`[TASK-XX] 内容`
4. 実装はSonnetで行う(本プロジェクトの標準。計画変更が必要な場合のみ上位モデルにエスカレーション)
5. 設計書と矛盾する実装判断が必要になったら、勝手に変更せず作業を止めて報告する

## ドメイン上の絶対規則
- **二重ステータス分離**:決済状態(orders.payment_status)と生産状態(order_items.production_status)は独立。混ぜない
- **物理1本=1行**:order_itemsはグリップ1本につき1レコード。数量nの注文はn行に展開
- **スナップショット原則**:注文明細には注文時点の商品名・仕様(options_snapshot)・確定単価を複製保存。マスタをJOINして表示に使わない
- **ステータス遷移はDB関数/専用API経由のみ**。UIから直接UPDATEしない
- 金額は全て円建て整数(int)。浮動小数点禁止
- 論理削除のみ。注文・生産履歴の物理削除禁止

## UI言語
- 管理画面(/admin):**日本語のみ**(利用者は工房スタッフ)
- フロント(/ja, /en):日英対応(Phase 3以降)

## ディレクトリ規約
```
src/app/admin/        # 管理画面(A系)
src/app/(store)/      # フロント(S系、Phase 3)
src/lib/supabase/     # クライアント生成
src/lib/domain/       # ステータス遷移・採番・推定ロジック
supabase/migrations/  # SQLマイグレーション(タイムスタンプ_内容.sql)
supabase/seed.sql     # 工程マスタ等のシード
```

## 禁止事項
- 認証情報・APIキーのハードコード(.env.local参照、.gitignore済を確認)
- 顧客個人情報のログ出力・テストコードへの実データ混入
- 設計書にないテーブル・カラムの独断追加
