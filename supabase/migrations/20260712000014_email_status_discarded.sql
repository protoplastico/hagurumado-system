-- TASK-13 A-13: 承認待ちdraftの「破棄」操作を表現するステータスを追加。
-- ALTER TYPE ... ADD VALUEは同一トランザクション内での新値使用に制限があるため、
-- このファイル単体(他の変更と混在させない)で完結させる。

alter type email_status add value 'discarded';
