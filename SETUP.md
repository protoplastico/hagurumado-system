# セットアップ手順(人間が行う作業)

Claude Codeでの開発開始前に、以下を**ご自身で**準備してください(アカウント作成・認証情報の取り扱いはAIには任せられません)。

## 1. アカウント準備
1. Supabase(https://supabase.com)— 新規プロジェクト作成(リージョン:Tokyo)
2. Vercel(https://vercel.com)— アカウントのみ(デプロイはPhase 1完了後)
3. GitHub — 空のプライベートリポジトリ作成(例:hagurumado-system)

## 2. 認証情報
Supabaseプロジェクトの Settings > API から以下を控える:
- Project URL
- anon public key
- service_role key(秘匿。絶対に公開しない)

## 3. Claude Codeでの開始手順
```bash
# 1. リポジトリをクローンし、本パッケージの中身を配置
git clone <your-repo> && cd <your-repo>
# CLAUDE.md, docs/, tasks/ をリポジトリ直下にコピー

# 2. Claude Code起動(実装はSonnet指定でコスト効率化)
claude --model sonnet

# 3. 最初の指示(例)
「CLAUDE.mdを読み、tasks/phase1/TASK-01から順に着手してください」
```

## 4. .env.local(TASK-01完了後に作成)
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

## 5. TASK-09の前に必要な作業
BASE管理画面 > 注文/顧客 からCSVをエクスポートし、カラム構成をClaude Codeに提示すること(個人情報行は取込作業時のみ使用。リポジトリにコミットしない)。

## 進行管理
- 各TASK完了ごとにコミットが積まれる。動作確認して次へ
- 設計変更が必要になった場合はこのチャット(Fable)に戻して判断
