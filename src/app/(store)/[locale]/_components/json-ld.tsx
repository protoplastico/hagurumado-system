// TASK-28: JSON-LD構造化データ埋め込み用の共通コンポーネント。
// XSS対策:このコンポーネントにはコード側で組み立てたオブジェクトのみを渡すこと
// (ユーザー入力やSanity本文をそのまま埋め込まない)。
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
