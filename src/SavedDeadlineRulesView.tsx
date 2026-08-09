import { useEffect, useMemo, useState } from 'react'

import {
  type DeadlineRuleProfile,
  describeDeadlineRuleProfile,
} from './deadlineRuleProfile.ts'
import {
  deleteDeadlineRuleProfile,
  getDeadlineRuleProfileChangeEvent,
  getDeadlineRuleProfiles,
} from './deadlineRuleProfileStorage.ts'
import {
  getDeadlineTriggerEvent,
} from './deadlineTrigger.ts'

type SavedDeadlineRulesViewProps = {
  onUseRule: (profile: DeadlineRuleProfile) => void
}

function triggerLabel(profile: DeadlineRuleProfile) {
  if (!profile.triggerKind) return 'Start date'

  return getDeadlineTriggerEvent(profile.triggerKind).label
}

function calendarLabel(value: DeadlineRuleProfile['holidayCalendar']) {
  if (value === 'none') return 'No holiday calendar'
  if (value === 'us') return 'US holidays'
  if (value === 'uk') return 'UK holidays'
  if (value === 'ca') return 'Canada holidays'
  if (value === 'au') return 'Australia holidays'
  return 'Philippines holidays'
}

export function SavedDeadlineRulesView({
  onUseRule,
}: SavedDeadlineRulesViewProps) {
  const [profiles, setProfiles] = useState<DeadlineRuleProfile[]>(() =>
    getDeadlineRuleProfiles(),
  )

  useEffect(() => {
    const eventName = getDeadlineRuleProfileChangeEvent()

    function refresh() {
      setProfiles(getDeadlineRuleProfiles())
    }

    window.addEventListener(eventName, refresh)
    window.addEventListener('storage', refresh)

    return () => {
      window.removeEventListener(eventName, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const hasProfiles = profiles.length > 0

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => a.name.localeCompare(b.name)),
    [profiles],
  )

  if (!hasProfiles) {
    return (
      <section className="saved-deadline-rules">
        <div className="saved-deadline-rules-empty">
          <strong>No saved rules yet</strong>
          <span>
            Save a rule from the deadline calculator and it will appear here on
            this device.
          </span>
        </div>

        <style>{`
          .saved-deadline-rules {
            margin-top: 18px;
          }

          .saved-deadline-rules-empty {
            display: grid;
            gap: 5px;
            padding: 18px;
            border: 1px dashed rgba(23, 48, 77, 0.18);
            border-radius: 14px;
            background: #fbfcfd;
            text-align: center;
          }

          .saved-deadline-rules-empty strong {
            color: #17304d;
            font-size: 1rem;
          }

          .saved-deadline-rules-empty span {
            color: #6f8298;
            font-size: 0.94rem;
            line-height: 1.5;
          }
        `}</style>
      </section>
    )
  }

  return (
    <section className="saved-deadline-rules" aria-labelledby="saved-rules-title">
      <div className="saved-deadline-rules-heading">
        <span>Saved on this device</span>
        <h2 id="saved-rules-title">Saved rules</h2>
        <p>
          Reuse the same counting setup with a new start date.
        </p>
      </div>

      <div className="saved-deadline-rules-list">
        {sortedProfiles.map((profile) => (
          <article key={profile.id} className="saved-deadline-rule-card">
            <div className="saved-deadline-rule-main">
              <strong>{profile.name}</strong>
              <span>{describeDeadlineRuleProfile(profile)}</span>
            </div>

            <div className="saved-deadline-rule-meta">
              <span>Clock starts: {triggerLabel(profile)}</span>
              <span>{calendarLabel(profile.holidayCalendar)}</span>
            </div>

            <div className="saved-deadline-rule-actions">
              <button
                type="button"
                className="primary"
                onClick={() => onUseRule(profile)}
              >
                Use this rule
              </button>

              <button
                type="button"
                onClick={() => deleteDeadlineRuleProfile(profile.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .saved-deadline-rules {
          margin-top: 22px;
        }

        .saved-deadline-rules-heading {
          display: grid;
          gap: 4px;
          text-align: center;
        }

        .saved-deadline-rules-heading > span {
          color: #7b8fa3;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .saved-deadline-rules-heading h2 {
          margin: 0;
          color: #17304d;
          font-size: 1.25rem;
        }

        .saved-deadline-rules-heading p {
          margin: 0;
          color: #6f8298;
          font-size: 0.94rem;
        }

        .saved-deadline-rules-list {
          display: grid;
          gap: 10px;
          max-width: 760px;
          margin: 14px auto 0;
        }

        .saved-deadline-rule-card {
          display: grid;
          gap: 10px;
          padding: 15px;
          border: 1px solid rgba(23, 48, 77, 0.11);
          border-radius: 14px;
          background: #fff;
        }

        .saved-deadline-rule-main {
          display: grid;
          gap: 3px;
        }

        .saved-deadline-rule-main strong {
          color: #17304d;
          font-size: 1rem;
        }

        .saved-deadline-rule-main span {
          color: #536d87;
          font-size: 0.94rem;
          line-height: 1.45;
        }

        .saved-deadline-rule-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
        }

        .saved-deadline-rule-meta span {
          padding: 5px 8px;
          border-radius: 999px;
          background: #f5f8fa;
          color: #6c8094;
          font-size: 0.82rem;
        }

        .saved-deadline-rule-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .saved-deadline-rule-actions button {
          min-height: 44px;
          padding: 9px 13px;
          border: 1px solid rgba(23, 48, 77, 0.16);
          border-radius: 10px;
          background: #fff;
          color: #294866;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .saved-deadline-rule-actions button.primary {
          border-color: #294866;
          background: #294866;
          color: #fff;
        }
      `}</style>
    </section>
  )
}
