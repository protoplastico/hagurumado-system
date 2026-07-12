'use client'

import { useEffect } from 'react'
import type { Locale } from '@/lib/i18n'

// ルートレイアウト(src/app/layout.tsx)は/adminとも共有するため<html lang>を
// ロケール別に固定できない。この軽量コンポーネントでマウント時にdocumentEl.langを更新する。
export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
