import { Check, ClipboardList, FileText, Hand, LogOut, MapPin, Navigation, ShieldAlert, Timer, UserRound, X } from 'lucide-react'
import { Button, Panel, Row, Tag, type Tone } from '../../components/ui'
import { useConfirm } from '../../hooks/useConfirm'
import { useTranslation } from '../../hooks/useTranslation'
import type { Contract, ContractCategory, ContractStatus } from '../../types/contracts'
import { formatDuration, formatMoney } from '../../utils/format'
import { resolveIcon } from '../../utils/icon'

const STATUS_TONE: Record<ContractStatus, Tone> = {
  open: 'accent',
  taken: 'warning',
  done: 'safe',
  cancelled: 'neutral',
  expired: 'danger',
}

export type CardView = 'board' | 'posted' | 'taken'

interface ContractCardProps {
  contract: Contract
  view: CardView
  now: number
  categories: ContractCategory[]
  admin: boolean
  index: number
  onAccept: (id: number) => void
  onAbandon: (id: number) => void
  onComplete: (id: number) => void
  onCancel: (id: number, admin?: boolean) => void
  onWaypoint: (location: { x: number; y: number }) => void
  onPaper: (contract: Contract) => void
}

export function ContractCard({
  contract,
  view,
  now,
  categories,
  admin,
  index,
  onAccept,
  onAbandon,
  onComplete,
  onCancel,
  onWaypoint,
  onPaper,
}: ContractCardProps) {
  const { t, locale } = useTranslation()
  const confirm = useConfirm<string>()
  const category = categories.find((c) => c.id === contract.category)
  const icon = (category && resolveIcon(category.icon)) || ClipboardList
  const remaining = contract.expiresAt - now
  const active = contract.status === 'open' || contract.status === 'taken'

  const confirmButton = (key: string, label: string, confirmLabel: string, onConfirm: () => void, iconComponent = X) => (
    <Button
      size="sm"
      variant={confirm.pending === key ? 'danger' : 'subtle'}
      icon={iconComponent}
      className={confirm.pending === key ? '' : 'hover:!text-help-danger'}
      onClick={() => confirm.request(key, onConfirm)}
    >
      {confirm.pending === key ? confirmLabel : label}
    </Button>
  )

  const actions = (
    <span className="flex flex-wrap items-center justify-end gap-1">
      {contract.location && active && (
        <Button size="sm" variant="subtle" icon={Navigation} onClick={() => contract.location && onWaypoint(contract.location)}>
          {t('btn_waypoint')}
        </Button>
      )}

      {view === 'board' && !contract.poster.isMe && (
        <Button size="sm" variant="primary" icon={Hand} onClick={() => onAccept(contract.id)}>
          {t('btn_accept')}
        </Button>
      )}
      {view === 'board' && contract.poster.isMe && <Tag>{t('contract_yours')}</Tag>}
      {view === 'board' && admin && !contract.poster.isMe &&
        confirmButton('admin', t('btn_admin_cancel'), t('btn_confirm'), () => onCancel(contract.id, true), ShieldAlert)}

      {view === 'posted' && contract.status === 'open' &&
        confirmButton('cancel', t('btn_cancel_contract'), t('btn_confirm'), () => onCancel(contract.id))}
      {view === 'posted' && contract.status === 'taken' &&
        confirmButton('complete', t('btn_complete'), t('btn_confirm_complete'), () => onComplete(contract.id), Check)}

      {view === 'taken' && contract.status === 'taken' &&
        confirmButton('abandon', t('btn_abandon'), t('btn_confirm'), () => onAbandon(contract.id), LogOut)}
    </span>
  )

  return (
    <Panel
      delay={index * 0.04}
      className={active ? '' : 'opacity-70'}
      header={{
        subtitle: `#${contract.id} · ${t(`category_${contract.category}`)} · ${t('contract_by', { name: contract.poster.name })}`,
        title: contract.title,
        icon,
        actions: (
          <>
            {view === 'board' ? (
              <Tag tone={remaining < 3600 ? 'warning' : 'neutral'} icon={Timer}>
                {formatDuration(remaining)}
              </Tag>
            ) : (
              <Tag tone={STATUS_TONE[contract.status]} solid={contract.status === 'taken'}>
                {t(`status_${contract.status}`)}
              </Tag>
            )}
            <Button size="sm" icon={FileText} onClick={() => onPaper(contract)} title={t('btn_paper')} />
          </>
        ),
      }}
      footer={{
        label: <span className="text-[24px] text-help-safe">{formatMoney(contract.reward, locale)}</span>,
        children: actions,
      }}
    >
      {contract.description && (
        <p className="border-b border-help-line py-3 text-[15px] leading-snug text-white/75">{contract.description}</p>
      )}

      {contract.contractor && (
        <Row
          index={0}
          label={t('contract_contractor')}
          value={contract.contractor.isMe ? t('contract_you') : contract.contractor.name}
          tone={contract.contractor.isMe ? 'accent' : undefined}
        />
      )}
      {view !== 'board' && active && (
        <Row index={1} label={t('contract_expires')} value={formatDuration(remaining)} tone={remaining < 3600 ? 'warning' : undefined} />
      )}
      <Row
        index={2}
        last
        label={t('contract_location')}
        tone={contract.location ? 'accent' : 'rgba(255,255,255,0.5)'}
        value={
          <span className="flex items-center justify-end gap-2">
            {contract.location ? t('contract_location_set') : t('contract_location_none')}
            {contract.location ? <MapPin className="h-4 w-4 shrink-0" /> : <UserRound className="h-4 w-4 shrink-0" />}
          </span>
        }
      />
    </Panel>
  )
}
