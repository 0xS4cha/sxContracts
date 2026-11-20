import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { KeyBadge } from '../../components/ui'
import { useTranslation } from '../../hooks/useTranslation'
import type { ContractPaper, ContractStatus } from '../../types/contracts'
import { formatMoney } from '../../utils/format'

const STAMP: Partial<Record<ContractStatus, { key: string; color: string }>> = {
  taken: { key: 'stamp_taken', color: '#1f4fa3' },
  done: { key: 'stamp_done', color: '#1e7a3c' },
  cancelled: { key: 'stamp_cancelled', color: '#b3261e' },
  expired: { key: 'stamp_expired', color: '#b3261e' },
}

interface PaperViewProps {
  paper: ContractPaper
  onClose: () => void
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-baseline gap-3 border-b border-dashed border-[#9b8f78]/60 py-1.5">
      <span className="text-[13px] uppercase tracking-[0.12em] text-[#6b604c]">{label}</span>
      <span className="text-[16px] leading-snug text-[#24201a]">{children}</span>
    </div>
  )
}

export function PaperView({ paper, onClose }: PaperViewProps) {
  const { t, locale } = useTranslation()
  const date = (seconds?: number | null) =>
    seconds ? new Date(seconds * 1000).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
  const stamp = STAMP[paper.status]
  const place = paper.place
    ? [paper.place.street, paper.place.zone].filter(Boolean).join(', ')
    : t('paper_place_none')

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-full w-[min(92vw,600px)] overflow-auto"
        initial={{ opacity: 0, y: 40, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        exit={{ opacity: 0, y: 30, rotate: 2 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative px-10 pb-8 pt-10 font-[family-name:var(--font-typewriter)] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
          style={{
            backgroundColor: '#efe6d2',
            backgroundImage:
              'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.55), transparent 45%), radial-gradient(circle at 85% 90%, rgba(120,95,55,0.18), transparent 50%), repeating-linear-gradient(0deg, rgba(90,70,40,0.035) 0 1px, transparent 1px 3px)',
          }}
        >
          <span className="absolute left-1/2 top-[-10px] h-[26px] w-[110px] -translate-x-1/2 rotate-[2deg] bg-[#d9cfae]/80 shadow-sm" />

          <div className="flex items-start justify-between gap-4 border-b-2 border-[#24201a] pb-3">
            <div>
              <div className="text-[13px] uppercase tracking-[0.3em] text-[#6b604c]">{t('paper_board')}</div>
              <div className="text-[30px] uppercase leading-tight tracking-wide text-[#24201a]">{t('paper_heading')}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] uppercase tracking-[0.2em] text-[#6b604c]">{t('paper_number')}</div>
              <div className="text-[24px] text-[#24201a]">{String(paper.id).padStart(6, '0')}</div>
            </div>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-[#3a3327]">
            {paper.contractor
              ? t('paper_intro', { poster: paper.poster, contractor: paper.contractor })
              : t('paper_intro_open', { poster: paper.poster })}
          </p>

          <div className="mt-4">
            <Line label={t('paper_object')}>{paper.title}</Line>
            <Line label={t('paper_category')}>{t(`category_${paper.category}`)}</Line>
            <Line label={t('paper_place')}>{place}</Line>
            <Line label={t('paper_issued')}>{date(paper.createdAt)}</Line>
            <Line label={t('paper_valid_until')}>{date(paper.expiresAt)}</Line>
          </div>

          {paper.description && (
            <div className="mt-4">
              <div className="text-[13px] uppercase tracking-[0.12em] text-[#6b604c]">{t('paper_details')}</div>
              <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-[#24201a]">{paper.description}</p>
            </div>
          )}

          <div className="mt-5 flex items-end justify-between border-y-2 border-[#24201a] py-3">
            <div>
              <div className="text-[13px] uppercase tracking-[0.12em] text-[#6b604c]">{t('paper_reward')}</div>
              <div className="text-[13px] text-[#6b604c]">{t('paper_reward_note')}</div>
            </div>
            <div className="text-[30px] text-[#24201a]">{formatMoney(paper.reward, locale)}</div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-8">
            {[
              { role: t('paper_signature_poster'), name: paper.poster },
              { role: t('paper_signature_contractor'), name: paper.contractor },
            ].map((sig) => (
              <div key={sig.role}>
                <div className="h-[46px] font-[family-name:var(--font-hand)] text-[34px] leading-[46px] text-[#1c2f6b]">
                  {sig.name ?? ''}
                </div>
                <div className="border-t border-[#24201a] pt-1 text-[12px] uppercase tracking-[0.15em] text-[#6b604c]">{sig.role}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-[11px] uppercase tracking-[0.25em] text-[#8a7f69]">{t('paper_footer')}</div>

          {stamp && (
            <motion.div
              className="pointer-events-none absolute right-10 top-[42%] border-[5px] px-5 py-1 text-[34px] uppercase tracking-[0.15em] opacity-80 mix-blend-multiply"
              style={{ color: stamp.color, borderColor: stamp.color }}
              initial={{ scale: 1.6, opacity: 0, rotate: -18 }}
              animate={{ scale: 1, opacity: 0.8, rotate: -14 }}
              transition={{ delay: 0.3, duration: 0.25, ease: 'easeOut' }}
            >
              {t(stamp.key)}
            </motion.div>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 bg-help-panel/90 px-4 py-2 font-help text-[16px] font-semibold uppercase tracking-wide text-white transition hover:bg-help-panel"
          >
            <X className="h-4 w-4" />
            {t('btn_close')}
            <KeyBadge label="ESC" size={20} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
