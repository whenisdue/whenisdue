import {
  type DeadlineAnswer,
} from './deadlineRules.ts'
import {
  buildDeadlineProvenanceRows,
} from './deadlineProvenance.ts'

type DeadlineProvenanceDetailsProps = {
  answer: DeadlineAnswer
}

export function DeadlineProvenanceDetails({
  answer,
}: DeadlineProvenanceDetailsProps) {
  const rows = buildDeadlineProvenanceRows(answer)

  return (
    <details className="deadline-provenance-details">
      <summary>Calculation details</summary>

      <div className="deadline-provenance-details-body">
        <p>
          These details identify the rule versions used to produce this answer.
        </p>

        <dl>
          {rows.map((row) => (
            <div key={`${row.label}-${row.value}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <style>{`
        .deadline-provenance-details {
          max-width: 720px;
          margin: 12px auto 0;
          border-top: 1px solid rgba(23, 48, 77, 0.08);
        }

        .deadline-provenance-details summary {
          min-height: 44px;
          display: flex;
          align-items: center;
          width: fit-content;
          color: #506a84;
          font-size: 0.92rem;
          font-weight: 850;
          cursor: pointer;
        }

        .deadline-provenance-details-body {
          display: grid;
          gap: 10px;
          padding: 2px 0 10px;
        }

        .deadline-provenance-details-body > p {
          margin: 0;
          color: #718397;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .deadline-provenance-details dl {
          display: grid;
          gap: 8px;
          margin: 0;
        }

        .deadline-provenance-details dl > div {
          display: grid;
          grid-template-columns: minmax(140px, 0.7fr) minmax(0, 1.3fr);
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(23, 48, 77, 0.06);
        }

        .deadline-provenance-details dt {
          color: #60758a;
          font-size: 0.88rem;
          font-weight: 850;
        }

        .deadline-provenance-details dd {
          margin: 0;
          color: #304b66;
          font-size: 0.9rem;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        @media (max-width: 620px) {
          .deadline-provenance-details dl > div {
            grid-template-columns: 1fr;
            gap: 3px;
          }
        }
      `}</style>
    </details>
  )
}
