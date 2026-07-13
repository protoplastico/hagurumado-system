import Image from 'next/image'
import { t, type Locale } from '@/lib/i18n'
import { urlFor } from '@/lib/sanity/image'
import type { CraftProcessStep } from '@/lib/sanity/types'
import type { ProductionStepName } from '@/lib/domain/store-craft-process'

// TASK-26: 製作工程紹介(10工程を写真+短文で)。工程名はPostgres production_stepsを正とし、
// 写真・短文はSanity siteSettings.craftProcessSteps(stepNoで突き合わせ)から取得する。
export function CraftProcessSection({
  locale,
  steps,
  craftProcessSteps,
}: {
  locale: Locale
  steps: ProductionStepName[]
  craftProcessSteps: CraftProcessStep[]
}) {
  const dict = t(locale)
  const byStepNo = new Map(craftProcessSteps.map((s) => [s.stepNo, s]))

  if (steps.length === 0) return null

  return (
    <section className="bg-kinari-light py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-2 text-center font-serif text-xl text-sumi">{dict.home.craftProcessHeading}</h2>
        <p className="mb-10 text-center text-sm text-sumi/60">{dict.home.craftProcessSubtext}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-5">
          {steps.map((step) => {
            const sanityStep = byStepNo.get(step.step_no)
            const name = locale === 'ja' ? step.name_ja : (step.name_en ?? step.name_ja)
            const caption = sanityStep ? (locale === 'ja' ? sanityStep.caption?.ja : sanityStep.caption?.en) : undefined

            return (
              <div key={step.step_no}>
                <div className="relative mb-2 aspect-square overflow-hidden bg-kinari-dark">
                  {sanityStep?.photo && (
                    <Image
                      src={urlFor(sanityStep.photo).width(300).height(300).fit('crop').auto('format').url()}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 640px) 150px, 40vw"
                    />
                  )}
                </div>
                <p className="text-xs font-medium text-sumi">
                  {step.step_no}. {name}
                </p>
                {caption && <p className="mt-1 text-xs leading-relaxed text-sumi/60">{caption}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
