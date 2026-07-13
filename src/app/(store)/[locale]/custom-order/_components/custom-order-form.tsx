'use client'

import { useState, type FormEvent } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { CustomOrderAnswers, GripShapeOption } from '@/lib/domain/custom-order'
import { PAIN_AREA_CODES } from '@/lib/domain/custom-order'
import { createMediaUploadUrl, submitCustomOrderInquiry } from '../actions'

const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']

type MediaFile = {
  id: string
  file: File
  kind: 'image' | 'video'
  status: 'uploading' | 'done' | 'error'
  path?: string
  errorMessage?: string
}

function kindOf(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

export function CustomOrderForm({ locale, gripShapeOptions }: { locale: Locale; gripShapeOptions: GripShapeOption[] }) {
  const dict = t(locale)
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [usagePurpose, setUsagePurpose] = useState('')
  const [dailyUsageHours, setDailyUsageHours] = useState<string>('')
  const [painAreas, setPainAreas] = useState<string[]>([])
  const [callusLocation, setCallusLocation] = useState('')
  const [preferredShapeOptionValueId, setPreferredShapeOptionValueId] = useState('')
  const [preferredShapeNote, setPreferredShapeNote] = useState('')
  const [penModel, setPenModel] = useState('')
  const [media, setMedia] = useState<MediaFile[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  function togglePainArea(code: string) {
    setPainAreas((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''

    for (const file of files) {
      const kind = kindOf(file)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setMedia((prev) => [...prev, { id, file, kind, status: 'error', errorMessage: dict.customOrder.mediaUnsupportedType }])
        continue
      }
      if (kind === 'video' && file.size > MAX_VIDEO_BYTES) {
        setMedia((prev) => [...prev, { id, file, kind, status: 'error', errorMessage: dict.customOrder.mediaTooLarge }])
        continue
      }

      setMedia((prev) => [...prev, { id, file, kind, status: 'uploading' }])

      const result = await createMediaUploadUrl(file.name, file.type, file.size)
      if (!result.ok) {
        setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'error', errorMessage: result.error } : m)))
        continue
      }

      const { error } = await supabase.storage.from('custom-order-media').uploadToSignedUrl(result.path, result.token, file)
      if (error) {
        setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'error', errorMessage: error.message } : m)))
        continue
      }

      setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'done', path: result.path } : m)))
    }
  }

  function removeMedia(id: string) {
    setMedia((prev) => prev.filter((m) => m.id !== id))
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = dict.customOrder.requiredError
    if (!email.trim()) next.email = dict.customOrder.requiredError
    const uploadedMedia = media.filter((m) => m.status === 'done')
    if (uploadedMedia.length === 0) next.media = dict.customOrder.mediaRequiredError
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const answers: CustomOrderAnswers = {
        usagePurpose,
        dailyUsageHours,
        painAreas,
        callusLocation,
        preferredShapeOptionValueId: preferredShapeOptionValueId || null,
        preferredShapeNote,
        penModel,
      }
      const mediaPaths = media
        .filter((m): m is MediaFile & { path: string } => m.status === 'done' && !!m.path)
        .map((m) => ({ path: m.path, kind: m.kind }))

      const result = await submitCustomOrderInquiry({
        locale,
        customerName: name.trim(),
        customerEmail: email.trim(),
        answers,
        mediaPaths,
      })

      if (!result.ok) {
        setSubmitError(dict.customOrder.submitError)
        setSubmitting(false)
        return
      }
      setSucceeded(true)
    } catch {
      setSubmitError(dict.customOrder.submitError)
      setSubmitting(false)
    }
  }

  if (succeeded) {
    return (
      <div className="border border-accent/30 bg-kinari-light p-6 text-center">
        <h2 className="mb-2 font-serif text-lg text-sumi">{dict.customOrder.successHeading}</h2>
        <p className="text-sm leading-loose text-sumi/70">{dict.customOrder.successBody}</p>
        <a href={`/${locale}`} className="mt-6 inline-block border border-sumi/30 px-6 py-3 text-sm text-sumi hover:border-accent hover:text-accent">
          {dict.customOrder.backToTop}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <Field label={dict.customOrder.nameLabel} error={errors.name}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label={dict.customOrder.emailLabel} error={errors.email}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-3 border-t border-sumi/10 pt-6">
        <Field label={dict.customOrder.usagePurposeLabel}>
          <input
            value={usagePurpose}
            onChange={(e) => setUsagePurpose(e.target.value)}
            placeholder={dict.customOrder.usagePurposePlaceholder}
            className={inputClass}
          />
        </Field>

        <Field label={dict.customOrder.dailyUsageHoursLabel}>
          <select value={dailyUsageHours} onChange={(e) => setDailyUsageHours(e.target.value)} className={inputClass}>
            <option value="">-</option>
            {Object.entries(dict.customOrder.dailyUsageHoursOptions).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <span className="mb-1 block text-xs text-sumi/70">{dict.customOrder.painAreasLabel}</span>
          <div className="flex flex-wrap gap-3">
            {PAIN_AREA_CODES.map((code) => (
              <label key={code} className="flex items-center gap-1 text-sm text-sumi">
                <input type="checkbox" checked={painAreas.includes(code)} onChange={() => togglePainArea(code)} />
                {dict.customOrder.painAreaOptions[code]}
              </label>
            ))}
          </div>
        </div>

        <Field label={dict.customOrder.callusLocationLabel}>
          <input
            value={callusLocation}
            onChange={(e) => setCallusLocation(e.target.value)}
            placeholder={dict.customOrder.callusLocationPlaceholder}
            className={inputClass}
          />
        </Field>

        <Field label={dict.customOrder.preferredShapeLabel}>
          <select
            value={preferredShapeOptionValueId}
            onChange={(e) => setPreferredShapeOptionValueId(e.target.value)}
            className={inputClass}
          >
            <option value="">{dict.customOrder.preferredShapeSelectPlaceholder}</option>
            {gripShapeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {locale === 'ja' ? opt.name_ja : opt.name_en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.customOrder.preferredShapeNoteLabel}>
          <textarea
            value={preferredShapeNote}
            onChange={(e) => setPreferredShapeNote(e.target.value)}
            placeholder={dict.customOrder.preferredShapeNotePlaceholder}
            rows={3}
            className={inputClass}
          />
        </Field>

        <Field label={dict.customOrder.penModelLabel}>
          <input
            value={penModel}
            onChange={(e) => setPenModel(e.target.value)}
            placeholder={dict.customOrder.penModelPlaceholder}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="border-t border-sumi/10 pt-6">
        <span className="mb-1 block text-xs text-sumi/70">{dict.customOrder.mediaLabel}</span>
        <p className="mb-3 text-xs text-sumi/50">{dict.customOrder.mediaHint}</p>

        <label className="inline-block cursor-pointer border border-sumi/30 px-4 py-2 text-xs text-sumi hover:border-accent">
          {dict.customOrder.mediaAdd}
          <input type="file" accept={ACCEPTED_TYPES.join(',')} multiple onChange={handleFileSelect} className="hidden" />
        </label>

        {media.length > 0 && (
          <ul className="mt-3 space-y-1">
            {media.map((m) => (
              <li key={m.id} className="flex items-center justify-between border border-sumi/10 bg-kinari-light px-3 py-2 text-xs text-sumi">
                <span>{m.file.name}</span>
                <span className="flex items-center gap-2">
                  {m.status === 'uploading' && <span className="text-sumi/50">{dict.customOrder.mediaUploading}</span>}
                  {m.status === 'done' && <span className="text-accent">{dict.customOrder.mediaUploaded}</span>}
                  {m.status === 'error' && <span className="text-red-800">{m.errorMessage}</span>}
                  <button type="button" onClick={() => removeMedia(m.id)} className="text-sumi/50 underline">
                    {dict.customOrder.mediaRemove}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {errors.media && <p className="mt-2 text-xs text-red-800">{errors.media}</p>}
      </section>

      {submitError && <p className="border border-red-900/20 bg-red-900/5 px-3 py-2 text-xs text-red-900">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting || media.some((m) => m.status === 'uploading')}
        className="w-full border border-sumi/30 py-3 text-sm text-sumi transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? dict.customOrder.submitting : dict.customOrder.submitButton}
      </button>
    </form>
  )
}

const inputClass = 'w-full border border-sumi/20 bg-white px-3 py-2 text-sm text-sumi'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-sumi/70">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-800">{error}</span>}
    </label>
  )
}
