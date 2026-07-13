import type { SupabaseClient } from '@supabase/supabase-js'

export type ProductionStepName = {
  step_no: number
  name_ja: string
  name_en: string | null
}

// TASK-26 S-01製作工程紹介。工程名はPostgres production_stepsを正とする
// (Sanity siteSettings.craftProcessStepsは写真・短文のみを保持し、stepNoで突き合わせる)。
export async function getProductionStepNames(supabase: SupabaseClient): Promise<ProductionStepName[]> {
  const { data, error } = await supabase
    .from('production_steps')
    .select('step_no, name_ja, name_en')
    .order('step_no', { ascending: true })
  if (error) throw error
  return (data ?? []) as ProductionStepName[]
}
