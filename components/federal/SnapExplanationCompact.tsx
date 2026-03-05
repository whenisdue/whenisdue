import React from "react";

type SnapExplanationCompactProps = {
  eventId: string;
  eventName: string;
  sourceLabel?: string;
};

export function SnapExplanationCompact(props: SnapExplanationCompactProps) {
  const cfg = SNAP_EXPLANATIONS[props.eventId];

  if (!cfg) return null;

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">How this SNAP schedule works</div>
          <div className="mt-0.5 text-xs text-slate-600">{props.eventName}</div>
        </div>

        {props.sourceLabel ? (
          <div className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
            {props.sourceLabel}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Your date depends on</div>
          <div className="mt-1.5 text-sm text-slate-700 leading-relaxed">{cfg.dependsOn}</div>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Where to find it</div>
          <ul className="mt-1.5 list-disc pl-4 text-sm text-slate-700 space-y-1">
            {cfg.whereToFind.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-100/50">
        <div className="font-bold flex items-center gap-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          Important Note
        </div>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          {cfg.importantNotes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type SnapExplanationConfig = {
  dependsOn: string;
  whereToFind: string[];
  importantNotes: string[];
};

const SNAP_EXPLANATIONS: Record<string, SnapExplanationConfig> = {
  "snap-ak-issuance-2026": {
    dependsOn: "Nothing — Alaska issues SNAP on the same day for everyone.",
    whereToFind: ["No case digit or last-name grouping required for Alaska."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "If you use an EBT app or bank feature, the app may display balances at a different time-of-day than the official date.",
    ],
  },
  "snap-nd-issuance-2026": {
    dependsOn: "Nothing — North Dakota issues SNAP on the same day for everyone.",
    whereToFind: ["No case digit or last-name grouping required for North Dakota."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "State-specific outages or EBT vendor maintenance can still delay posting.",
    ],
  },
  "snap-ri-issuance-2026": {
    dependsOn: "Nothing — Rhode Island issues SNAP on the same day for everyone.",
    whereToFind: ["No case digit or last-name grouping required for Rhode Island."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "If your card is replaced, posting can sometimes take an extra processing cycle.",
    ],
  },
  "snap-vt-issuance-2026": {
    dependsOn: "Nothing — Vermont issues SNAP on the same day for everyone.",
    whereToFind: ["No case digit or last-name grouping required for Vermont."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "If you moved states, your new state schedule may be different even if the program is SNAP.",
    ],
  },
  "snap-nh-issuance-2026": {
    dependsOn: "Nothing — New Hampshire issues SNAP on the same day for everyone (the 5th).",
    whereToFind: ["No case digit or last-name grouping required for New Hampshire."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "Some EBT portals show pending balance changes before they are spendable.",
    ],
  },
  "snap-sd-issuance-2026": {
    dependsOn: "Nothing — South Dakota issues SNAP on the same day for everyone (the 10th).",
    whereToFind: ["No case digit or last-name grouping required for South Dakota."],
    importantNotes: [
      "Dates shown are the official calendar availability dates for the month.",
      "If your deposit is missing, check the state EBT portal/app before assuming your case changed.",
    ],
  },
  "snap-va-issuance-2026": {
    dependsOn: "The last digit of your case number.",
    whereToFind: [
      "Your case number is typically on notices/letters from the state agency.",
      "If you have an online benefits portal, it's usually shown in your case details.",
    ],
    importantNotes: [
      "Select your bucket (0–3, 4–5, 6–9) to see the official date.",
      "These are calendar-day issues; weekend timing can still vary by EBT vendor posting time.",
    ],
  },
  "snap-ut-issuance-2026": {
    dependsOn: "The first letter of the last name on the case.",
    whereToFind: [
      "Use the last name of the head of household (the person listed first on the case).",
      "Check your award letter or online portal if you're unsure who the head of household is.",
    ],
    importantNotes: [
      "Select A–G, H–O, or P–Z to see the official date.",
      "If the last name changes, your group may change next month depending on state processing.",
    ],
  },
  "snap-wy-issuance-2026": {
    dependsOn: "The first letter of the last name on the case.",
    whereToFind: [
      "Use the last name of the head of household (the person listed first on the case).",
      "If you have multiple cards, the schedule still follows the case holder’s last name.",
    ],
    importantNotes: [
      "Select A–D, E–K, L–R, or S–Z to see the official date.",
      "If your household moved recently, allow time for the case to transfer before expecting the new state's date.",
    ],
  },
  "snap-nj-issuance-2026": {
    dependsOn: "The 7th digit of your case number.",
    whereToFind: [
      "Look for your case number on state notices/letters; identify the 7th digit.",
      "If you have an online portal, the case number is usually under your case profile.",
    ],
    importantNotes: [
      "Choose the exact 7th-digit group. (0/6/7/8/9 all load on the 5th.)",
      "If you are unsure, call your county board/agency to confirm your case-number digits.",
    ],
  },
};