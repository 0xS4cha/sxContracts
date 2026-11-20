import { useState } from 'react'
import { ClipboardPlus, MapPin } from 'lucide-react'
import { Button, Field, Input, Modal, Row, Tabs, TextArea } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import type { BoardSettings, CreateContractPayload } from '../../types/contracts'
import { formatMoney } from '../../utils/format'

interface CreateContractModalProps {
  isOpen: boolean
  settings: BoardSettings
  money: boolean
  onClose: () => void
  onCreate: (payload: CreateContractPayload) => Promise<boolean>
}

export function CreateContractModal({ isOpen, settings, money, onClose, onCreate }: CreateContractModalProps) {
  const { t, locale } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(settings.categories[0]?.id ?? 'other')
  const [reward, setReward] = useState(settings.minReward * 10)
  const [duration, setDuration] = useState(settings.durations[1] ?? settings.durations[0])
  const [attachLocation, setAttachLocation] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const fee = Math.floor(reward * settings.fee)
  const titleLength = title.trim().length
  const valid =
    titleLength >= settings.titleLength.min &&
    titleLength <= settings.titleLength.max &&
    reward >= settings.minReward &&
    reward <= settings.maxReward

  const reset = () => {
    setTitle('')
    setDescription('')
    setReward(settings.minReward * 10)
    setAttachLocation(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    const ok = await onCreate({ title: title.trim(), description: description.trim(), category, reward, duration, attachLocation })
    setSubmitting(false)
    if (ok) {
      reset()
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardPlus}
      subtitle={t('create_subtitle')}
      title={t('create_title')}
      footer={
        <>
          <Button onClick={onClose}>{t('btn_cancel')}</Button>
          <Button variant="primary" type="submit" form="create-contract-form" disabled={!valid || submitting}>
            {t('create_submit')}
          </Button>
        </>
      }
    >
      <form id="create-contract-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Field label={t('create_name')} hint={t('create_name_hint', { min: settings.titleLength.min, max: settings.titleLength.max })}>
          <Input value={title} maxLength={settings.titleLength.max} onChange={(e) => setTitle(e.target.value)} placeholder={t('create_name_placeholder')} />
        </Field>

        <Field label={t('create_category')}>
          <Tabs
            value={category}
            onChange={setCategory}
            options={settings.categories.map((c) => ({ value: c.id, label: t(`category_${c.id}`) }))}
          />
        </Field>

        <Field label={t('create_description')}>
          <TextArea
            rows={3}
            value={description}
            maxLength={settings.descriptionLength}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('create_description_placeholder')}
            className="resize-none !text-[16px]"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t('create_reward')} hint={`${formatMoney(settings.minReward, locale)} - ${formatMoney(settings.maxReward, locale)}`}>
            <Input
              type="number"
              min={settings.minReward}
              max={settings.maxReward}
              value={reward}
              onChange={(e) => setReward(Math.floor(Number(e.target.value) || 0))}
            />
          </Field>
          <Field label={t('create_duration')}>
            <Tabs
              value={String(duration)}
              onChange={(value) => setDuration(Number(value))}
              options={settings.durations.map((h) => ({ value: String(h), label: `${h}h` }))}
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setAttachLocation((v) => !v)}
          className={`flex h-[42px] w-full items-center justify-between px-3 text-[17px] font-semibold uppercase tracking-wide transition ${
            attachLocation ? 'bg-help-accent text-help-panel' : 'border border-white/20 bg-help-panel/80 text-white/65'
          }`}
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('create_attach_location')}
          </span>
          <span className={`h-4 w-4 ${attachLocation ? 'bg-help-panel' : 'border border-white/40'}`} />
        </button>

        {money && (
          <div className="bg-help-panel/60 px-3">
            <Row label={t('create_reward')} value={formatMoney(reward, locale)} />
            <Row label={t('create_fee', { percent: Math.round(settings.fee * 100) })} value={formatMoney(fee, locale)} tone="rgba(255,255,255,0.6)" />
            <Row label={t('create_total')} value={formatMoney(reward + fee, locale)} tone="safe" last />
          </div>
        )}
      </form>
    </Modal>
  )
}
