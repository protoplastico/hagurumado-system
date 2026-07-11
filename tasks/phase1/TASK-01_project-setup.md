# TASK-01 プロジェクト初期化
担当:Sonnet / 依存:なし / 目安:2h

## 作業
1. Next.js 14プロジェクト作成(App Router, TypeScript strict, Tailwind, ESLint)
2. 依存追加:@supabase/supabase-js @supabase/ssr zod date-fns
3. `src/lib/supabase/` にserver/client/middleware用クライアント生成を実装(@supabase/ssr標準パターン)
4. `.env.local.example` 作成(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
5. `npm run typecheck` スクリプト追加(tsc --noEmit)
6. CLAUDE.mdのディレクトリ規約どおりの空構造を作成

## 受入条件
- [ ] `npm run dev` でトップが表示される
- [ ] typecheck / lint がパス
- [ ] .env.localが.gitignoreに含まれる
