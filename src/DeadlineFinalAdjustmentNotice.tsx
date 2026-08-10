import {
  type DeadlineAnswer,
} from './deadlineRules.ts'
import {
  formatPlainDate,
} from './dateHelpers.ts'
import {
  getHolidayCalendarOption,
} from './holidayCalendars.ts'

type DeadlineFinalAdjustmentNoticeProps = {
  answer: DeadlineAnswer
}

function blockedReason(answer: DeadlineAnswer) {
  const blocked = answer.finalDayAdjustment.blockedDates
  if (blocked.length === 0) return null

  const first = blocked[0]

  if (first.reason === 'holiday' && first.name) {
    return first.name
  }

  if (first.reason === 'weekend') {
    return 'a non-working weekend day'
  }

  return 'a non-working day'
}

export function DeadlineFinalAdjustmentNotice({
  answer,
}: DeadlineFinalAdjustmentNoticeProps) {
  if (!answer.finalDayAdjustment.applied) return null

  const candidate = answer.finalDayAdjustment.candidateDate
  const adjusted = answer.finalDayAdjustment.adjustedDate
  const reason = blockedReason(answer)
  const calendar = getHolidayCalendarOption(answer.holidayCalendar)

  return (
    <div className="deadline-final-adjustment-note" role="note">
      <strong>Final date adjusted</strong>
      <p>
        The counting result was{' '}
        <b>{formatPlainDate(candidate)}</b>
        {reason ? `, which was ${reason}. ` : '. '}
        Your rule moves a non-business final date to the{' '}
        {answer.endDayAdjustment === 'next-business-day'
          ? 'next'
          : 'previous'}{' '}
        business day, so the due date is{' '}
        <b>{formatPlainDate(adjusted)}</b>.
      </p>
      <span>
        Adjustment checked against Monday–Friday
        {answer.holidayCalendar === 'none'
          ? '. Public holidays were not excluded.'
          : ` and ${calendar.label}.`}
      </span>

      <style>{`
        .deadline-final-adjustment-note {
          max-width: 680px;
          margin: 14px auto 0;
          padding: 14px 16px;
          border: 1px solid rgba(183, 121, 31, 0.2);
          border-radius: 12px;
          background: #fffaf0;
          color: #5d4925;
          text-align: left;
        }

        .deadline-final-adjustment-note > strong {
          display: block;
          color: #76571f;
          font-size: 1rem;
        }

        .deadline-final-adjustment-note > p {
          margin: 5px 0 0;
          color: #5d4925;
          font-size: 0.98rem;
          line-height: 1.55;
        }

        .deadline-final-adjustment-note > span {
          display: block;
          margin-top: 6px;
          color: #7b6846;
          font-size: 0.9rem;
          line-height: 1.45;
        }
      `}</style>
    </div>
  )
}
