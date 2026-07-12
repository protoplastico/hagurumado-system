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
- [x] オプション選択で価格が正しく加算される(日英で別delta)
- [x] 受注停止variation選択不可、全体休止中は「カートに入れる」無効化
- [x] スナップショットJSONがdb_design.mdの形式と一致

## 実施結果メモ

- カスタマイズステッパーは①機種→②以降は商品に割当てられたオプショングループ(sort_order順)→
  最終確認、の順で実装。requires_note=trueの選択肢を選ぶと自由記述欄が必須表示され、
  未記入の間は「次へ」が無効化される。オプション未投入のグループ(インク染め/製品仕様Apple Pencil、
  TASK-17でグループのみ作成)はステッパーから除外している(選べる選択肢が無いため)。
- 「カートに入れる」はTASK-20(カート)未実装のため、押すと選択内容のプレビュー表示のみ行う
  プレースホルダ動作。実際の永続化はTASK-20で実装する(コード内にコメントで明記)。
- is_custom_order商品はステッパー自体を出さず、案内文+ガイドページへの問い合わせ導線を表示
  (申込フォームはPhase 5以降)。
- options_snapshotはdb_design.md記載の`[{"group":"...","value":"...","delta":0}]`形式に
  一致させ、注文時点(=表示中)のlocaleに応じたgroup/value名称とdelta(price_delta_domestic/
  international)を複製する(スナップショット原則)。
- 商品画像:新マイグレーションで`products.image_path`カラム+`product-images`Storageバケット
  (public)を追加。A-14の商品編集画面にアップロード/削除UIを追加(アップロード時に旧画像を
  自動削除)。Storageバケット/RLSポリシー部分はローカルPostgresにSupabase Storage拡張が
  無いため、ストレージスキーマの簡易スタブを組んで構文・適用のみ検証した(pg_cronマイグレーション
  と同様の制約)。
- 検証:ローカルPostgresで新マイグレーション適用+実データ(LITE ブラウン:3バリエーション/
  4オプショングループ)の整合性を確認。カスタマイズステッパーの一連の操作(受注停止機種の
  選択不可、requires_note必須化、価格加算、全体休止中のカート無効化)はPlaywrightで実際に
  クリック操作して検証(base price 4200 + finish delta 300 = 4500円を確認)。S-02のフィルタ
  フォーム・カード(受付中/受付休止中の色分け)も表示確認済み。
