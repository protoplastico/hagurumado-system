# TASK-19 商品一覧+商品詳細(カスタマイズステッパー)
担当:Sonnet / 依存:TASK-18 / 目安:10h
根拠:screen_design.md S-02, S-03

## 作業
1. S-02 商品一覧:
   - フィルタ:対応ペンメーカー(variations.maker)/シリーズ/価格帯。URLクエリ同期
   - カード:商品画像プレースホルダ/名前/樹種/価格(locale別)/受付状態
2. S-03 商品詳細+カスタマイズステッパー:
   - ステップ:①ペン機種(variation選択。accepting_orders=falseは選択不可+「受付休止中」表示)→②以降は商品に割当てられたオプショングループを順に表示→最終確認
   - 価格リアルタイム計算:基本価格+オプションdelta(locale別delta使用)。ステッパー下部に常時表示
   - requires_note=trueの選択肢を選んだ場合、自由記述欄(custom_note)を必須表示
   - is_custom_order商品(フルオーダー)は「カートに入れる」ではなく案内文+問い合わせ導線(申込フォームはPhase 5以降)
   - 選択状態はorder_items.options_snapshot互換のJSON形式で構築(TASK-21でそのまま保存)
3. 商品画像:Supabase Storage `product-images` バケット+products.image_pathカラム追加(新マイグレーション)。未設定時はプレースホルダ表示。画像アップロードUIをA-14に追加

## 受入条件
- [ ] オプション選択で価格が正しく加算される(日英で別delta)
- [ ] 受注停止variation選択不可、全体休止中は「カートに入れる」無効化
- [ ] スナップショットJSONがdb_design.mdの形式と一致
