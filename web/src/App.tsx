import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { NuiWrapper } from './components/NuiWrapper'
import { useEscapeKey } from './hooks/useEscapeKey'
import { useNuiEvent } from './hooks/useNuiEvent'
import { Board } from './pages/Board'
import { PaperView } from './pages/components/PaperView'
import type { ContractPaper, ShowPaperData } from './types/contracts'
import type { SetVisibleData } from './types/nui'
import { fetchNui } from './utils/fetchNui'
import { isEnvBrowser } from './utils/nui'

export default function App() {
  const [visible, setVisible] = useState(isEnvBrowser())
  const [paper, setPaper] = useState<{ paper: ContractPaper; standalone: boolean } | null>(null)

  const handleSetVisible = useCallback(({ visible: next }: SetVisibleData) => setVisible(next), [])
  useNuiEvent<SetVisibleData>('setVisible', handleSetVisible)
  useNuiEvent<ShowPaperData>('showPaper', (data) => setPaper({ paper: data.paper, standalone: data.standalone }))
  useNuiEvent('hidePaper', () => setPaper(null))

  const closePaper = useCallback(() => {
    if (paper?.standalone) void fetchNui('close')
    setPaper(null)
  }, [paper])

  useEscapeKey(closePaper, paper !== null)

  useEffect(() => {
    void fetchNui('nuiReady', { ok: true })
  }, [])

  return (
    <>
      <NuiWrapper visible={visible} escape={paper === null}>
        <div className="flex h-full w-full font-help text-white antialiased selection:bg-help-accent/40">
          <Board visible={visible} onPaper={(next) => setPaper({ paper: next, standalone: false })} />
        </div>
      </NuiWrapper>
      <AnimatePresence>{paper && <PaperView key={paper.paper.id} paper={paper.paper} onClose={closePaper} />}</AnimatePresence>
    </>
  )
}
