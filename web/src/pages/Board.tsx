import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Briefcase, ClipboardList, ClipboardPlus, FileSignature, Inbox, X } from 'lucide-react'
import { Button, IconBadge, PageHeader, Panel, SearchField, Sidebar, Tabs, type SidebarItem } from '../components/ui'
import { useTranslation } from '../hooks/useTranslation'
import { useBoard } from '../hooks/useBoard'
import type { BoardCategory, Contract } from '../types/contracts'
import { fetchNui } from '../utils/fetchNui'
import { formatMoney } from '../utils/format'
import { ContractCard, type CardView } from './components/ContractCard'
import { CreateContractModal } from './components/CreateContractModal'

export function Board({ visible }: { visible: boolean }) {
  const { t, locale } = useTranslation()
  const [category, setCategory] = useState<BoardCategory>('board')
  const [collapsed, setCollapsed] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const board = useBoard(visible)
  const data = board.board

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[17px] font-semibold uppercase tracking-wide text-white/50">
        {t('loading')}
      </div>
    )
  }

  const activePosted = data.posted.filter((c) => c.status === 'open' || c.status === 'taken').length
  const activeTaken = data.taken.filter((c) => c.status === 'taken').length

  const items: SidebarItem<BoardCategory>[] = [
    { id: 'board', label: t('sidebar_board'), icon: ClipboardList, badge: data.open.length },
    { id: 'posted', label: t('sidebar_posted'), icon: FileSignature, badge: activePosted },
    { id: 'taken', label: t('sidebar_taken'), icon: Briefcase, badge: activeTaken, badgeTone: activeTaken > 0 ? 'warning' : 'neutral' },
  ]

  const headers: Record<BoardCategory, { title: string; subtitle: string; icon: typeof ClipboardList }> = {
    board: { title: t('header_board'), subtitle: t('header_board_sub'), icon: ClipboardList },
    posted: { title: t('header_posted'), subtitle: t('header_posted_sub'), icon: FileSignature },
    taken: { title: t('header_taken'), subtitle: t('header_taken_sub'), icon: Briefcase },
  }
  const header = headers[category]

  const query = search.toLowerCase()
  const lists: Record<BoardCategory, Contract[]> = {
    board: data.open.filter(
      (c) =>
        (filter === 'all' || c.category === filter) &&
        (c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.poster.name.toLowerCase().includes(query)),
    ),
    posted: data.posted,
    taken: data.taken,
  }
  const list = lists[category]
  const view: CardView = category

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        brand={<IconBadge icon={ClipboardList} size={34} />}
        subtitle="sxContracts"
        title={t('sidebar_title')}
        watermark="BOARD"
        section={t('sidebar_section')}
        items={items}
        active={category}
        onSelect={setCategory}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        collapseLabel={t('menu_collapse')}
        expandLabel={t('menu_expand')}
        closeLabel={t('btn_close')}
        onClose={() => void fetchNui('close')}
        footer={
          data.money ? (
            <div className="flex items-center justify-between px-1 text-[15px] font-semibold uppercase tracking-wide text-white/55">
              <span>{t('sidebar_earned')}</span>
              <span className="text-help-safe">{formatMoney(data.stats.earned, locale)}</span>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader
          title={header.title}
          subtitle={header.subtitle}
          icon={header.icon}
          refreshLabel={t('btn_refresh')}
          loading={board.loading}
          onRefresh={() => void board.refresh()}
        />

        {board.error && (
          <div className="flex items-center justify-between gap-3 border-l border-help-line bg-help-danger px-6 py-2 text-[15px] font-semibold uppercase tracking-wide text-help-panel">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t(`error_${board.error}`)}
            </span>
            <button type="button" onClick={board.clearError} className="text-help-panel/70 hover:text-help-panel">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto border-l border-help-line p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {category === 'board' && (
                <div className="flex flex-wrap items-center gap-3">
                  <SearchField value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('board_search')} />
                  <Button variant="primary" icon={ClipboardPlus} onClick={() => setCreateOpen(true)}>
                    {t('btn_post')}
                  </Button>
                  <div className="w-full">
                    <Tabs
                      value={filter}
                      onChange={setFilter}
                      options={[
                        { value: 'all', label: t('filter_all', { count: data.open.length }) },
                        ...data.settings.categories.map((c) => ({
                          value: c.id,
                          label: `${t(`category_${c.id}`)} (${data.open.filter((o) => o.category === c.id).length})`,
                        })),
                      ]}
                    />
                  </div>
                </div>
              )}

              {list.length === 0 ? (
                <Panel header={{ title: t(`empty_${category}`), icon: Inbox }} bodyClassName="px-4 py-4 text-[15px] text-white/65">
                  {t(`empty_${category}_desc`)}
                </Panel>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {list.map((contract, idx) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      view={view}
                      now={board.serverNow}
                      categories={data.settings.categories}
                      admin={data.me.admin}
                      index={idx}
                      onAccept={(id) => void board.accept(id)}
                      onAbandon={(id) => void board.abandon(id)}
                      onComplete={(id) => void board.complete(id)}
                      onCancel={(id, admin) => void board.cancel(id, admin)}
                      onWaypoint={board.setWaypoint}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CreateContractModal
        isOpen={createOpen}
        settings={data.settings}
        money={data.money}
        onClose={() => setCreateOpen(false)}
        onCreate={board.create}
      />
    </div>
  )
}
