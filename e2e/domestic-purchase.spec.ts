import { test, expect } from '@playwright/test'

// TASK-32 シナリオ1(国内購入・ja):商品選択→カスタマイズ→カート→Stripe決済→注文確認ページ到達まで。
// 注文確認メール・管理画面での受注確認は自動化せず、docs/e2e_checklist.mdの手動チェック項目とする
// (メール受信確認は別サービス連携が必要なため、費用対効果の観点でPlaywright自動化の対象外とした)。
//
// 実行にはステージング環境でStripeが**テストモード**であることが前提(本番キーに対して
// テストカードは使えない)。カード情報はStripe公式のテスト用カード番号を使用する。
//
// 注意:このテストはステージング上に「受注受付中(accepting_orders_global=true)」の商品が
// 最低1件、対応ペン機種(accepting_orders=true)付きで公開されていることを前提とする。

test('国内購入(ja):商品選択→カスタマイズ→カート→Stripe決済→注文確認', async ({ page }) => {
  await page.goto('/ja')

  // トップから商品一覧へ
  await page.getByRole('link', { name: '商品一覧を見る' }).first().click()
  await expect(page).toHaveURL(/\/ja\/products/)

  // 一覧の最初の商品カードへ(在庫・受付状況は商品ごとに異なるため、特定コードに依存しない)
  const firstProductLink = page.locator('a[href*="/ja/products/"]').first()
  await firstProductLink.click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // ペン機種選択(受付中の機種を選ぶ。受付休止中はdisabled)
  const variationButton = page.locator('button:not([disabled])', { hasText: /^\[/ }).first()
  await variationButton.click()

  // 以降のステップ(オプショングループ)は必須項目のみ選択し、「次へ」を押し進める。
  // 「ご選択内容の確認」(最終ステップ)が出るまでループする。
  for (let i = 0; i < 10; i++) {
    const summaryHeading = page.getByRole('heading', { name: 'ご選択内容の確認' })
    if (await summaryHeading.isVisible().catch(() => false)) break

    const nextButton = page.getByRole('button', { name: '次へ' })
    const isDisabled = await nextButton.isDisabled().catch(() => true)
    if (isDisabled) {
      // 必須オプションが未選択のため進めない場合、最初の選択肢を選んでから再試行する
      const firstOptionButton = page.locator('div.space-y-2 > button').first()
      if (await firstOptionButton.isVisible().catch(() => false)) {
        await firstOptionButton.click()
      }
    }
    if (await nextButton.isEnabled().catch(() => false)) {
      await nextButton.click()
    }
  }

  await page.getByRole('button', { name: 'カートに入れる' }).click()
  await expect(page.getByText('カートに追加しました。')).toBeVisible()

  await page.getByRole('link', { name: 'カートを見る' }).click()
  await expect(page).toHaveURL(/\/ja\/cart/)

  await page.getByRole('link', { name: 'レジに進む' }).click()
  await expect(page).toHaveURL(/\/ja\/checkout/)

  // お届け先情報の入力(テスト用のダミー値。実在の個人情報は使わない)
  await page.getByLabel('お名前').fill('E2Eテスト太郎')
  await page.getByLabel('メールアドレス').fill('e2e-test@example.com')
  await page.getByLabel('電話番号').fill('0300000000')
  await page.getByLabel('郵便番号').fill('100-0001')
  await page.getByLabel('住所').fill('東京都千代田区千代田1-1')

  // 支払い方法はStripe(既定)のまま、送料計算完了を待ってから送信
  await expect(page.getByRole('button', { name: 'お支払いへ進む' })).toBeEnabled({ timeout: 20_000 })
  await page.getByRole('button', { name: 'お支払いへ進む' }).click()

  // Stripeのホスト型Checkoutページへ遷移する
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 })

  // Stripeテストカードで決済(公式テストカード番号)。
  // Stripe Checkoutのフィールド構成は将来変わり得るため、実行時に要調整の可能性がある。
  await page.getByLabel(/email/i).fill('e2e-test@example.com').catch(() => {})
  await page.getByPlaceholder(/card number/i).fill('4242424242424242')
  await page.getByPlaceholder(/mm.*yy/i).fill('12/34')
  await page.getByPlaceholder(/cvc/i).fill('123')
  const cardholderName = page.getByLabel(/cardholder name/i)
  if (await cardholderName.isVisible().catch(() => false)) {
    await cardholderName.fill('E2E Test')
  }
  await page.getByRole('button', { name: /pay/i }).click()

  // 注文完了ページへ戻る
  await page.waitForURL(/\/ja\/checkout\/complete/, { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'ご注文ありがとうございました' })).toBeVisible()
  await expect(page.getByText('注文番号')).toBeVisible()
})
