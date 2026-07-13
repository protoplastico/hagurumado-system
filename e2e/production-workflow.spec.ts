import { test, expect } from '@playwright/test'

// TASK-32 シナリオ2(業務一巡):管理画面でキュー→バッチ作成→工程1-7→検品→発送プール→
// 発送バッチ→伝票番号登録まで。宛名CSV出力・発送メール送信の実体確認はブラウザ上の
// アサーションでは検証しづらいため(前者はファイルダウンロード、後者はfn_mark_shipped内で
// 送信されアプリケーションコードから直接は追えない)、docs/e2e_checklist.mdの手動確認に委ねる。
//
// 実行にはE2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD(管理者アカウント)と、キューに最低1件の
// 注文アイテムが存在すること(直前にdomestic-purchase.spec.ts、または本番相当のリハーサル
// データ投入で用意しておくこと)が前提。

test('業務一巡:キュー→バッチ作成→工程進行→検品→発送バッチ→伝票番号登録', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD
  test.skip(!adminEmail || !adminPassword, 'E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORDが未設定のためスキップ')

  // --- ログイン ---
  await page.goto('/admin/login')
  await page.locator('#email').fill(adminEmail!)
  await page.locator('#password').fill(adminPassword!)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15_000 })

  // --- キュー:全選択してバッチ作成 ---
  await page.goto('/admin/queue')
  const queueCheckboxes = page.locator('label input[type="checkbox"]')
  await expect(queueCheckboxes.first()).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: '全選択' }).click()
  await page.getByRole('button', { name: 'バッチ作成' }).click()

  // 成功するとバッチのかんばん画面へ遷移する
  await page.waitForURL(/\/admin\/batches\/[^/]+$/, { timeout: 15_000 })

  // --- 工程1〜7を進める(「次工程へ」→確認モーダル「実行する」を繰り返す) ---
  for (let step = 1; step <= 7; step++) {
    // 検品(最終工程)は全アイテムのチェックが必要
    const inspectionCheckboxes = page.locator('label input[type="checkbox"]')
    if ((await inspectionCheckboxes.count()) > 0 && (await page.getByRole('button', { name: 'バッチ完了' }).isVisible().catch(() => false))) {
      const count = await inspectionCheckboxes.count()
      for (let i = 0; i < count; i++) {
        const box = inspectionCheckboxes.nth(i)
        if (!(await box.isChecked())) await box.check()
      }
      await page.getByRole('button', { name: 'バッチ完了' }).click()
    } else {
      await page.getByRole('button', { name: '次工程へ' }).click()
    }
    // 確認モーダル
    const confirmButton = page.getByRole('button', { name: '実行する' })
    if (await confirmButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmButton.click()
    }
    await page.waitForTimeout(500)
  }

  // --- 発送プール:全選択して発送バッチ作成 ---
  await page.goto('/admin/shipping')
  await expect(page.getByRole('button', { name: '発送バッチ作成' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: '全選択' }).click()
  await page.getByRole('button', { name: '発送バッチ作成' }).click()
  await page.waitForURL(/\/admin\/shipping\/[^/]+$/, { timeout: 15_000 })

  // --- 伝票番号(追跡番号)の登録 ---
  const trackingInputs = page.getByPlaceholder('伝票番号(追跡番号)')
  const trackingCount = await trackingInputs.count()
  for (let i = 0; i < trackingCount; i++) {
    await trackingInputs.nth(i).fill(`E2E-TRACKING-${i + 1}`)
  }
  const registerButtons = page.getByRole('button', { name: '登録' })
  const registerCount = await registerButtons.count()
  for (let i = 0; i < registerCount; i++) {
    await registerButtons.nth(0).click() // 登録するたびに行が減るため常に先頭を押す
    await page.waitForTimeout(500)
  }

  await expect(page.getByText('全件の伝票番号登録が完了し、発送バッチは発送済みになりました。')).toBeVisible({
    timeout: 15_000,
  })
})
