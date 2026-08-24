import { useState } from 'react'
import { isSupabaseConfigured, supabase } from './va/supabaseClient'

type AnswerFeedbackReason =
  | 'wrong_result'
  | 'rule_unclear'
  | 'missing_option'
  | 'different_question'

type FeedbackStage = 'question' | 'reasons' | 'thanks'

const feedbackStoragePrefix = 'whenisdue:answer-feedback:v1:'
const feedbackTtlMs = 30 * 24 * 60 * 60 * 1000

const reasonOptions: Array<{
  value: AnswerFeedbackReason
  label: string
}> = [
  { value: 'wrong_result', label: 'Wrong result' },
  { value: 'rule_unclear', label: 'Rule unclear' },
  { value: 'missing_option', label: 'Missing option' },
  { value: 'different_question', label: 'Different question' },
]

function feedbackStorageKey(pagePath: string) {
  return `${feedbackStoragePrefix}${pagePath}`
}

function hasRecentFeedback(pagePath: string) {
  try {
    const stored = window.localStorage.getItem(feedbackStorageKey(pagePath))
    if (!stored) return false

    const submittedAt = Number(stored)
    if (!Number.isFinite(submittedAt)) return false

    return Date.now() - submittedAt < feedbackTtlMs
  } catch {
    return false
  }
}

function markFeedbackSubmitted(pagePath: string) {
  try {
    window.localStorage.setItem(
      feedbackStorageKey(pagePath),
      String(Date.now()),
    )
  } catch {
    // Feedback still works when browser storage is unavailable.
  }
}

function trackFeedbackEvent(
  name: string,
  values: Record<string, string | boolean | null>,
) {
  const payload = {
    event: `wid_${name}`,
    page_path: window.location.pathname,
    ...values,
  }

  const analyticsWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }

  if (typeof analyticsWindow.gtag === 'function') {
    analyticsWindow.gtag('event', `wid_${name}`, {
      page_path: window.location.pathname,
      ...values,
    })
  } else {
    analyticsWindow.dataLayer ??= []
    analyticsWindow.dataLayer.push(payload)
  }

  window.dispatchEvent(
    new CustomEvent('whenisdue:analytics', {
      detail: payload,
    }),
  )
}

export default function AnswerFeedback() {
  const pagePath = window.location.pathname
  const [hidden] = useState(() => hasRecentFeedback(pagePath))
  const [stage, setStage] = useState<FeedbackStage>('question')
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (hidden) {
    return null
  }

  async function submitFeedback(
    satisfied: boolean,
    reason: AnswerFeedbackReason | null,
  ) {
    if (pending) return

    setPending(true)
    setErrorMessage(null)

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('answer_feedback').insert({
          page_path: pagePath,
          satisfied,
          reason,
        })

        if (error) {
          throw error
        }
      }

      markFeedbackSubmitted(pagePath)
      trackFeedbackEvent('answer_feedback_submitted', {
        satisfied,
        reason,
        storage: isSupabaseConfigured ? 'supabase' : 'local_preview',
      })
      setStage('thanks')
    } catch (error) {
      console.warn('WhenIsDue answer feedback could not be saved.', error)
      setErrorMessage('Couldn’t save that feedback. Try again.')
      trackFeedbackEvent('answer_feedback_failed', {
        satisfied,
        reason,
        storage: 'supabase',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <aside className="answer-feedback" aria-label="Answer feedback">
        {stage === 'thanks' ? (
          <p className="answer-feedback-thanks" role="status">
            Thanks — that helps. ✓
          </p>
        ) : (
          <>
            <div className="answer-feedback-question">
              <p>Did this answer what you came here to find?</p>
              <div className="answer-feedback-choice-row">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void submitFeedback(true, null)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  disabled={pending}
                  aria-expanded={stage === 'reasons'}
                  onClick={() => {
                    setErrorMessage(null)
                    setStage('reasons')
                    trackFeedbackEvent('answer_feedback_not_quite_opened', {
                      satisfied: false,
                      reason: null,
                    })
                  }}
                >
                  Not quite
                </button>
              </div>
            </div>

            {stage === 'reasons' ? (
              <div className="answer-feedback-reasons">
                <p>What was missing?</p>
                <div>
                  {reasonOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      disabled={pending}
                      onClick={() =>
                        void submitFeedback(false, option.value)
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="answer-feedback-error" role="status">
                {errorMessage}
              </p>
            ) : null}
          </>
        )}
      </aside>

      <style>{`
        .answer-feedback {
          width: min(100%, 620px);
          margin: 12px auto 0;
          color: #66798d;
          font-size: 0.78rem;
          line-height: 1.4;
          text-align: center;
        }

        .answer-feedback p {
          margin: 0;
        }

        .answer-feedback-question {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 7px 10px;
        }

        .answer-feedback-choice-row,
        .answer-feedback-reasons > div {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
        }

        .answer-feedback button {
          min-height: 40px;
          padding: 6px 11px;
          border: 1px solid rgba(21, 54, 84, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #526a82;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 850;
          cursor: pointer;
        }

        .answer-feedback button:hover {
          border-color: rgba(45, 123, 100, 0.36);
          color: #246b52;
        }

        .answer-feedback button:focus-visible {
          outline: 3px solid rgba(45, 123, 100, 0.22);
          outline-offset: 2px;
        }

        .answer-feedback button:disabled {
          opacity: 0.58;
          cursor: wait;
        }

        .answer-feedback-reasons {
          margin-top: 8px;
        }

        .answer-feedback-reasons > p {
          margin-bottom: 6px;
          color: #738598;
          font-size: 0.74rem;
        }

        .answer-feedback-thanks {
          color: #2d6f59;
          font-weight: 850;
        }

        .answer-feedback-error {
          margin-top: 7px !important;
          color: #934a42;
          font-size: 0.73rem;
        }

        @media (max-width: 560px) {
          .answer-feedback {
            margin-top: 10px;
            font-size: 0.76rem;
          }

          .answer-feedback-question {
            display: grid;
            justify-items: center;
          }

          .answer-feedback button {
            min-height: 44px;
          }

          .answer-feedback-reasons > div {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  )
}
