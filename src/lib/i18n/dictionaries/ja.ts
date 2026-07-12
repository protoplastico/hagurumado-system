// フロント(/ja)のUI文言辞書。商品名・説明文はDBのname_ja/wood_species_jaを直接使用し、
// ここには含めない(CLAUDE.md/TASK-18指示書:「UI文言のみ対象」)。
const ja = {
  common: {
    siteName: '葉車堂細工所',
    products: '商品一覧',
    cart: 'カート',
    login: 'ログイン',
    switchLanguage: 'English',
  },
  footer: {
    guide: 'ガイド',
    tokushoho: '特定商取引法に基づく表記',
    privacy: 'プライバシーポリシー',
    rights: '葉車堂細工所',
  },
  home: {
    brandStatement: '和の美意識と天然素材で仕立てる、世界にひとつのペングリップ。',
    brandSubtext: 'ひとつひとつ手作業で削り出す、樹種そのものの表情を楽しむ木製ペングリップ工房です。',
    ctaShop: '商品一覧を見る',
    featuredHeading: '商品ラインナップ',
    noProducts: '現在公開中の商品はありません。',
  },
  status: {
    acceptingTrue: 'ただいまご注文を承っております',
    acceptingFalse: 'ただいま受注を一時休止しております',
    waitWeeksPrefix: '現在の目安お届け期間:約',
    waitWeeksSuffix: '週間',
    waitWeeksUnknown: '目安お届け期間は準備中です',
  },
} as const

export default ja
