import { useMemo, useState } from 'react'

import {
  type DeadlineDirection,
  type DeadlineUnit,
  type EndDayAdjustment,
  type StartDayConvention,
} from './deadlineRules.ts'
import {
  type DeadlineTriggerKind,
  getDeadlineTriggerEvent,
} from './deadlineTrigger.ts'
import {
  type HolidayCalendarId,
} from './holidayCalendars.ts'
import {
  markDeadlineSetupSaved,
} from './deadlineRuleProfileExperiment.ts'
import {
  saveDeadlineRuleProfile,
} from './deadlineRuleProfileStorage.ts'

type SaveDeadlineRuleButtonProps = {
  triggerDateKey: string
  triggerKind: DeadlineTriggerKind | null
  duration: number
  direction: DeadlineDirection
  unit: DeadlineUnit
  startDayConvention: StartDayConvention
  holidayCalendar: HolidayCalendarId
  endDayAdjustment: EndDayAdjustment
}

function buildSuggestedName({
  triggerKind,
  duration,
  direction,
  unit,
}: Pick<
  SaveDeadlineRuleButtonProps,
  'triggerKind' | 'duration' | 'direction' | 'unit'
>) {
  const triggerLabel = triggerKind
    ? getDeadlineTriggerEvent(triggerKind).label.toLowerCase()
    : 'start date'

  const unitLabel =
    unit === 'business-days'
      ? duration === 1
        ? 'business day'
        : 'business days'
      : duration === 1
        ? 'calendar day'
        : 'calendar days'

  return `${duration} ${unitLabel} ${direction} ${triggerLabel}`
}

export function SaveDeadlineRuleButton(
  props: SaveDeadlineRuleButtonProps,
) {
  const suggestedName = useMemo(
    () =>
      buildSuggestedName({
        triggerKind: props.triggerKind,
        duration: props.duration,
        direction: props.direction,
        unit: props.unit,
      }),
    [props.triggerKind, props.duration, props.direction, props.unit],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(suggestedName)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')

  function openEditor() {
    setName(suggestedName)
    setStatus('idle')
    setIsOpen(true)
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const profile = saveDeadlineRuleProfile({
      name: trimmedName,
      triggerKind: props.triggerKind,
      duration: props.duration,
      direction: props.direction,
      unit: props.unit,
      startDayConvention: props.startDayConvention,
      holidayCalendar: props.holidayCalendar,
      endDayAdjustment: props.endDayAdjustment,
    })

    markDeadlineSetupSaved(profile.id, props.triggerDateKey)
    setStatus('saved')
  }

  if (!isOpen) {
    return (
      <div className="save-deadline-rule">
        <button type="button" onClick={openEditor}>
          Save deadline setup
        </button>

        <style>{`
          .save-deadline-rule {
            margin-top: 14px;
            text-align: center;
          }

          .save-deadline-rule > button {
            min-height: 44px;
            padding: 9px 16px;
            border: 1px solid rgba(23, 48, 77, 0.16);
            border-radius: 10px;
            background: #fff;
            color: #294866;
            font: inherit;
            font-weight: 850;
            cursor: pointer;
          }

          .save-deadline-rule > button:hover {
            background: #f8fbfd;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="save-deadline-rule save-deadline-rule-editor">
      <div className="save-deadline-rule-copy">
        <strong>Save deadline setup</strong>
        <span>
          Reuse these counting rules later with a different start date.
        </span>
      </div>

      <label>
        <span>Setup name</span>
        <input
          type="text"
          value={name}
          maxLength={80}
          onChange={(event) => {
            setName(event.target.value)
            setStatus('idle')
          }}
        />
      </label>

      <div className="save-deadline-rule-actions">
        <button
          type="button"
          className="primary"
          disabled={!name.trim()}
          onClick={handleSave}
        >
          {status === 'saved' ? 'Saved' : 'Save setup'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setStatus('idle')
          }}
        >
          Done
        </button>
      </div>

      {status === 'saved' ? (
        <p>Saved on this device.</p>
      ) : null}

      <style>{`
        .save-deadline-rule-editor {
          display: grid;
          gap: 12px;
          max-width: 620px;
          margin: 16px auto 0;
          padding: 15px;
          border: 1px solid rgba(23, 48, 77, 0.12);
          border-radius: 14px;
          background: #fbfcfd;
          text-align: left;
        }

        .save-deadline-rule-copy {
          display: grid;
          gap: 3px;
        }

        .save-deadline-rule-copy strong {
          color: #17304d;
          font-size: 1rem;
        }

        .save-deadline-rule-copy span,
        .save-deadline-rule-editor > p {
          margin: 0;
          color: #6f8298;
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .save-deadline-rule-editor label {
          display: grid;
          gap: 6px;
        }

        .save-deadline-rule-editor label > span {
          color: #405d78;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .save-deadline-rule-editor input {
          width: 100%;
          min-height: 44px;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid rgba(23, 48, 77, 0.16);
          border-radius: 10px;
          background: #fff;
          color: #17304d;
          font: inherit;
        }

        .save-deadline-rule-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .save-deadline-rule-actions button {
          min-height: 44px;
          padding: 9px 14px;
          border: 1px solid rgba(23, 48, 77, 0.16);
          border-radius: 10px;
          background: #fff;
          color: #294866;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .save-deadline-rule-actions button.primary {
          border-color: #294866;
          background: #294866;
          color: #fff;
        }

        .save-deadline-rule-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      `}</style>
    </div>
  )
}
