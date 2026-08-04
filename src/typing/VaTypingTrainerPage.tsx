import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import './VaTypingTrainerPage.css'
import { buildTypingText, typingCategoryLabels } from './typingPassages'
import { clearTypingHistory, loadTypingHistory, saveTypingResult } from './typingStorage'
import type {
  TestDurationSeconds,
  TypingCategory,
  TypingResult,
} from './typingTypes'

type NavigationProps = {
  onNavigate: (path: string) => void
}

type TestPhase = 'ready' | 'running' | 'finished'

type TestMetrics = {
  netWpm: number
  rawWpm: number
  accuracy: number
  correctCharacters: number
  incorrectCharacters: number
  correctedMistakes: number
  uncorrectedMistakes: number
}

const durations: TestDurationSeconds[] = [60, 180, 300]
const heartbeatMs = 250

function safeNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function toDisplayInteger(value: number): number {
  return Math.max(0, Math.round(safeNumber(value)))
}

function calculateMetrics(
  targetText: string,
  typedText: string,
  elapsedMs: number,
  correctedMistakes: number,
): TestMetrics {
  let correctCharacters = 0
  let incorrectCharacters = 0

  for (let index = 0; index < typedText.length; index += 1) {
    if (typedText[index] === targetText[index]) {
      correctCharacters += 1
    } else {
      incorrectCharacters += 1
    }
  }

  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 60000)
  const rawWpm = typedText.length / 5 / elapsedMinutes
  const netWpm = Math.max(0, (typedText.length / 5 - incorrectCharacters) / elapsedMinutes)
  const accuracy = typedText.length > 0 ? (correctCharacters / typedText.length) * 100 : 100

  return {
    netWpm: safeNumber(netWpm),
    rawWpm: safeNumber(rawWpm),
    accuracy: Math.min(100, Math.max(0, safeNumber(accuracy, 100))),
    correctCharacters,
    incorrectCharacters,
    correctedMistakes,
    uncorrectedMistakes: incorrectCharacters,
  }
}

function formatTimer(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(safeNumber(milliseconds) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function getAssessment(metrics: TestMetrics): string {
  if (metrics.accuracy < 90) {
    return 'Focus on accuracy before increasing speed. Slow down slightly and aim for clean, controlled keystrokes.'
  }

  if (metrics.accuracy < 96) {
    return 'Your speed is developing. A little more accuracy will protect your final score during timed applications.'
  }

  if (metrics.netWpm < 35) {
    return 'Your accuracy is strong. Keep the same control while gradually increasing your pace.'
  }

  return 'You maintained a good balance of speed and accuracy. Continue practicing realistic VA passages under time pressure.'
}

const TypingText = memo(function TypingText({
  targetText,
  registerCharacter,
  caretRef,
}: {
  targetText: string
  registerCharacter: (index: number, element: HTMLSpanElement | null) => void
  caretRef: RefObject<HTMLSpanElement | null>
}) {
  const segments: Array<{ text: string; startIndex: number }> = []
  const matcher = /\S+\s*/g
  let match: RegExpExecArray | null

  while ((match = matcher.exec(targetText)) !== null) {
    segments.push({
      text: match[0],
      startIndex: match.index,
    })
  }

  return (
    <div className="typing-copy" aria-hidden="true">
      {segments.map((segment) => {
        const characters = Array.from(segment.text)

        return (
          <span
            className="typing-word"
            key={`${segment.startIndex}-${segment.text}`}
          >
            {characters.map((character, localIndex) => {
              const index = segment.startIndex + localIndex

              return (
                <span
                  className="typing-character is-untouched"
                  data-character-index={index}
                  key={`${index}-${character}`}
                  ref={(element) => registerCharacter(index, element)}
                >
                  {character === ' ' ? '\u00a0' : character}
                </span>
              )
            })}
          </span>
        )
      })}

      <span ref={caretRef} className="typing-smooth-caret" />
    </div>
  )
})

export default function VaTypingTrainerPage({ onNavigate }: NavigationProps) {
  const [durationSeconds, setDurationSeconds] = useState<TestDurationSeconds>(60)
  const [category, setCategory] = useState<TypingCategory>('va-email')
  const [showLiveMetrics, setShowLiveMetrics] = useState(true)
  const [phase, setPhase] = useState<TestPhase>('ready')
  const [seed, setSeed] = useState(() => Date.now())
  const [nowMs, setNowMs] = useState(() => performance.now())
  const [liveMetrics, setLiveMetrics] = useState<TestMetrics>(() =>
    calculateMetrics('', '', 0, 0),
  )
  const [finishedMetrics, setFinishedMetrics] = useState<TestMetrics | null>(null)
  const [history, setHistory] = useState<TypingResult[]>(() => loadTypingHistory())
  const [completionMessage, setCompletionMessage] = useState('')

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingViewportRef = useRef<HTMLDivElement>(null)
  const characterRefs = useRef<Array<HTMLSpanElement | null>>([])
  const caretRef = useRef<HTMLSpanElement>(null)
  const typedTextRef = useRef('')
  const correctedMistakesRef = useRef(0)
  const startMsRef = useRef<number | null>(null)
  const phaseRef = useRef<TestPhase>('ready')
  const scrollFrameRef = useRef<number | null>(null)

  const targetText = useMemo(() => buildTypingText(category, seed), [category, seed])
  const durationMs = durationSeconds * 1000
  const elapsedMs =
    startMsRef.current === null
      ? 0
      : Math.min(durationMs, Math.max(0, nowMs - startMsRef.current))
  const remainingMs = Math.max(0, durationMs - elapsedMs)
  const displayedMetrics = finishedMetrics ?? liveMetrics

  const registerCharacter = useCallback((index: number, element: HTMLSpanElement | null) => {
    characterRefs.current[index] = element
  }, [])

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const setPhaseState = useCallback((nextPhase: TestPhase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
  }, [])

  const updateCharacterClass = useCallback(
    (index: number, className: 'is-correct' | 'is-incorrect' | 'is-untouched') => {
      const element = characterRefs.current[index]

      if (!element) {
        return
      }

      element.className = `typing-character ${className}`
    },
    [],
  )

  const moveCaretToCharacter = useCallback((index: number, animate = true) => {
    const caret = caretRef.current
    const characters = characterRefs.current

    if (!caret || characters.length === 0) {
      return
    }

    const target = characters[index]
    let x = 0
    let y = 0

    if (target) {
      x = target.offsetLeft
      y = target.offsetTop
    } else {
      const lastCharacter = characters[characters.length - 1]

      if (!lastCharacter) {
        return
      }

      x = lastCharacter.offsetLeft + lastCharacter.offsetWidth
      y = lastCharacter.offsetTop
    }

    if (!animate) {
      caret.classList.add('is-positioning')
    }

    caret.style.transform = `translate3d(${x}px, ${y}px, 0)`

    if (!animate) {
      window.requestAnimationFrame(() => {
        caret.classList.remove('is-positioning')
      })
    }
  }, [])

  const keepCaretVisible = useCallback((index: number) => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current)
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const viewport = typingViewportRef.current
      const activeCharacter = characterRefs.current[index]

      if (!viewport || !activeCharacter) {
        return
      }

      const characterTop = activeCharacter.offsetTop
      const safeTop = viewport.scrollTop + 34
      const safeBottom = viewport.scrollTop + viewport.clientHeight - 58

      if (characterTop < safeTop || characterTop > safeBottom) {
        viewport.scrollTop = Math.max(0, characterTop - 54)
      }
    })
  }, [])

  const resetRenderedCharacters = useCallback(() => {
    for (let index = 0; index < characterRefs.current.length; index += 1) {
      updateCharacterClass(index, 'is-untouched')
    }

    moveCaretToCharacter(0, false)
  }, [moveCaretToCharacter, updateCharacterClass])

  const resetTest = useCallback(() => {
    typedTextRef.current = ''
    correctedMistakesRef.current = 0
    startMsRef.current = null
    setPhaseState('ready')
    setFinishedMetrics(null)
    setLiveMetrics(calculateMetrics(targetText, '', 0, 0))
    setCompletionMessage('')
    setNowMs(performance.now())
    setSeed(Date.now())

    window.requestAnimationFrame(() => {
      resetRenderedCharacters()
      typingViewportRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      focusInput()
    })
  }, [focusInput, resetRenderedCharacters, setPhaseState, targetText])

  const finishTest = useCallback(() => {
    if (phaseRef.current !== 'running' || startMsRef.current === null) {
      return
    }

    const finalMetrics = calculateMetrics(
      targetText,
      typedTextRef.current,
      durationMs,
      correctedMistakesRef.current,
    )
    const result: TypingResult = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      durationSeconds,
      category,
      netWpm: toDisplayInteger(finalMetrics.netWpm),
      rawWpm: toDisplayInteger(finalMetrics.rawWpm),
      accuracy: Math.round(finalMetrics.accuracy * 10) / 10,
      correctCharacters: finalMetrics.correctCharacters,
      incorrectCharacters: finalMetrics.incorrectCharacters,
      correctedMistakes: finalMetrics.correctedMistakes,
      uncorrectedMistakes: finalMetrics.uncorrectedMistakes,
    }

    setFinishedMetrics(finalMetrics)
    setLiveMetrics(finalMetrics)
    setHistory(saveTypingResult(result))
    setPhaseState('finished')
    setCompletionMessage(
      `Test complete. ${toDisplayInteger(finalMetrics.netWpm)} net words per minute with ${Math.round(finalMetrics.accuracy)} percent accuracy.`,
    )
    inputRef.current?.blur()
  }, [category, durationMs, durationSeconds, setPhaseState, targetText])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }

    const timer = window.setInterval(() => {
      const nextNow = performance.now()
      setNowMs(nextNow)

      if (startMsRef.current !== null) {
        setLiveMetrics(
          calculateMetrics(
            targetText,
            typedTextRef.current,
            Math.min(durationMs, nextNow - startMsRef.current),
            correctedMistakesRef.current,
          ),
        )
      }
    }, heartbeatMs)

    return () => window.clearInterval(timer)
  }, [durationMs, phase, targetText])

  useEffect(() => {
    if (
      phase === 'running' &&
      startMsRef.current !== null &&
      nowMs - startMsRef.current >= durationMs
    ) {
      finishTest()
    }
  }, [durationMs, finishTest, nowMs, phase])

  useEffect(() => {
    typedTextRef.current = ''
    correctedMistakesRef.current = 0
    startMsRef.current = null
    setPhaseState('ready')
    setFinishedMetrics(null)
    setLiveMetrics(calculateMetrics(targetText, '', 0, 0))
    setCompletionMessage('')
    setNowMs(performance.now())

    window.requestAnimationFrame(() => {
      typingViewportRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      moveCaretToCharacter(0, false)
      focusInput()
    })
  }, [focusInput, moveCaretToCharacter, setPhaseState, targetText])

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }
    }
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab') {
      event.preventDefault()
      resetTest()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      inputRef.current?.blur()
      return
    }

    if (phaseRef.current === 'finished') {
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()

      const currentText = typedTextRef.current
      if (currentText.length === 0) {
        return
      }

      const currentIndex = currentText.length
      const removedIndex = currentIndex - 1

      if (currentText[removedIndex] !== targetText[removedIndex]) {
        correctedMistakesRef.current += 1
      }

      typedTextRef.current = currentText.slice(0, -1)
      updateCharacterClass(removedIndex, 'is-untouched')
      moveCaretToCharacter(removedIndex)
      keepCaretVisible(removedIndex)
      return
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
      return
    }

    event.preventDefault()

    const currentIndex = typedTextRef.current.length
    if (currentIndex >= targetText.length) {
      return
    }

    if (phaseRef.current === 'ready') {
      const keyTime = performance.now()
      startMsRef.current = keyTime
      setNowMs(keyTime)
      setPhaseState('running')
    }

    const isCorrect = event.key === targetText[currentIndex]
    updateCharacterClass(currentIndex, isCorrect ? 'is-correct' : 'is-incorrect')
    typedTextRef.current += event.key

    const nextIndex = typedTextRef.current.length
    moveCaretToCharacter(nextIndex)
    keepCaretVisible(nextIndex)
  }

  function changeDuration(nextDuration: TestDurationSeconds) {
    if (phaseRef.current === 'running') {
      return
    }

    setDurationSeconds(nextDuration)
  }

  function changeCategory(nextCategory: TypingCategory) {
    if (phaseRef.current === 'running') {
      return
    }

    setCategory(nextCategory)
  }

  function handleClearHistory() {
    if (!window.confirm('Clear all saved typing results on this device?')) {
      return
    }

    clearTypingHistory()
    setHistory([])
  }

  return (
    <main className="typing-page-shell">
      <header className="typing-site-header">
        <a
          className="typing-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('/')
          }}
        >
          <img src="/whenisdue-logo.png" alt="WhenIsDue" />
        </a>

        <nav aria-label="Typing trainer navigation">
          <a
            href="/workspace"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/workspace')
            }}
          >
            VA Workspace
          </a>
          <a
            href="/calculators"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/calculators')
            }}
          >
            Calculators
          </a>
        </nav>
      </header>

      <section className="typing-intro" aria-labelledby="typing-page-title">
        <p>Free practice for virtual assistant applicants</p>
        <h1 id="typing-page-title">VA Typing Trainer</h1>
        <span>Practice realistic emails and office passages with a smooth, distraction-free timed test.</span>
      </section>

      <section className="typing-trainer-card" aria-label="Typing test">
        <div className="typing-toolbar">
          <fieldset disabled={phase === 'running'}>
            <legend>Time</legend>
            <div className="typing-choice-row">
              {durations.map((duration) => (
                <button
                  className={durationSeconds === duration ? 'is-selected' : ''}
                  key={duration}
                  type="button"
                  onClick={() => changeDuration(duration)}
                >
                  {duration / 60} min
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset disabled={phase === 'running'}>
            <legend>Practice material</legend>
            <div className="typing-choice-row">
              {(['va-email', 'office'] as TypingCategory[]).map((option) => (
                <button
                  className={category === option ? 'is-selected' : ''}
                  key={option}
                  type="button"
                  onClick={() => changeCategory(option)}
                >
                  {typingCategoryLabels[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="typing-live-toggle">
            <input
              type="checkbox"
              checked={showLiveMetrics}
              disabled={phase === 'running'}
              onChange={(event) => setShowLiveMetrics(event.target.checked)}
            />
            Show live WPM and accuracy
          </label>
        </div>

        <div className="typing-stat-row" aria-label="Live test information">
          <div>
            <span>Time</span>
            <strong>{formatTimer(remainingMs)}</strong>
          </div>
          <div className={!showLiveMetrics && phase !== 'finished' ? 'is-hidden-metric' : ''}>
            <span>Net WPM</span>
            <strong>{toDisplayInteger(displayedMetrics.netWpm)}</strong>
          </div>
          <div className={!showLiveMetrics && phase !== 'finished' ? 'is-hidden-metric' : ''}>
            <span>Accuracy</span>
            <strong>{toDisplayInteger(displayedMetrics.accuracy)}%</strong>
          </div>
        </div>

        <div className={`typing-start-hint phase-${phase}`}>
          <strong>{phase === 'ready' ? 'Start typing whenever you are ready.' : phase === 'running' ? 'Test in progress' : 'Test complete'}</strong>
          <span>{phase === 'ready' ? 'The passage is fully visible. The timer starts with your first character.' : phase === 'running' ? 'Press Tab at any time to restart.' : 'Review your results below or start another test.'}</span>
        </div>

        <div
          className={`typing-viewport phase-${phase}`}
          ref={typingViewportRef}
          role="application"
          aria-label="Typing passage. Start typing to begin the timer."
          onClick={focusInput}
        >
          <TypingText
            targetText={targetText}
            registerCharacter={registerCharacter}
            caretRef={caretRef}
          />

          <textarea
            ref={inputRef}
            className="typing-capture-input"
            aria-label="Typing test input"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value=""
            onChange={() => undefined}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="typing-test-actions">
          <button type="button" onClick={resetTest}>Restart test</button>
          <span><kbd>Tab</kbd> restart <kbd>Esc</kbd> release focus</span>
        </div>

        <p className="typing-device-note">
          This trainer works best on a laptop or desktop computer with a physical keyboard.
        </p>
      </section>

      {phase === 'finished' && finishedMetrics ? (
        <section className="typing-results-card" aria-labelledby="typing-results-title">
          <div className="typing-results-heading">
            <div>
              <p>Test complete</p>
              <h2 id="typing-results-title">Your results</h2>
            </div>
            <button type="button" onClick={resetTest}>Try another test</button>
          </div>

          <div className="typing-result-grid">
            <ResultMetric label="Net WPM" value={toDisplayInteger(finishedMetrics.netWpm)} emphasis />
            <ResultMetric label="Raw WPM" value={toDisplayInteger(finishedMetrics.rawWpm)} />
            <ResultMetric label="Accuracy" value={`${toDisplayInteger(finishedMetrics.accuracy)}%`} emphasis />
            <ResultMetric label="Correct characters" value={finishedMetrics.correctCharacters} />
            <ResultMetric label="Incorrect characters" value={finishedMetrics.incorrectCharacters} />
            <ResultMetric label="Corrected mistakes" value={finishedMetrics.correctedMistakes} />
            <ResultMetric label="Uncorrected mistakes" value={finishedMetrics.uncorrectedMistakes} />
            <ResultMetric label="Test length" value={`${durationSeconds / 60} min`} />
          </div>

          <div className="typing-assessment">
            <strong>What to work on next</strong>
            <p>{getAssessment(finishedMetrics)}</p>
          </div>
        </section>
      ) : null}

      <section className="typing-history-card" aria-labelledby="typing-history-title">
        <div className="typing-history-heading">
          <div>
            <p>Saved only on this device</p>
            <h2 id="typing-history-title">Recent results</h2>
          </div>
          {history.length > 0 ? (
            <button type="button" onClick={handleClearHistory}>Clear history</button>
          ) : null}
        </div>

        {history.length > 0 ? (
          <div className="typing-history-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Practice</th>
                  <th scope="col">Time</th>
                  <th scope="col">Net WPM</th>
                  <th scope="col">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((result) => (
                  <tr key={result.id}>
                    <td>{new Date(result.completedAt).toLocaleDateString()}</td>
                    <td>{typingCategoryLabels[result.category]}</td>
                    <td>{result.durationSeconds / 60} min</td>
                    <td>{toDisplayInteger(result.netWpm)}</td>
                    <td>{toDisplayInteger(result.accuracy)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="typing-empty-history">Complete a timed test and your latest results will appear here.</p>
        )}
      </section>

      <p className="typing-completion-announcement" aria-live="polite">
        {completionMessage}
      </p>
    </main>
  )
}

function ResultMetric({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string | number
  emphasis?: boolean
}) {
  return (
    <div className={emphasis ? 'is-emphasis' : ''}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
