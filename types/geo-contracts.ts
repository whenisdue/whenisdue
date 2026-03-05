export interface AnswerBlockBinding {
  version: string;
  id: string;
  origin: string;
  canonicalUrl: string;
  question: string;
  answerText: string;
  answerTextSha256: string;
  eventTime: {
    kind: "DATE_ONLY" | "DATE_TIME";
    timezone: string;
    display: string;
    isoUtc: string;
  };
  status: "CONFIRMED" | "EXPECTED";
  lastVerifiedUtc: string;
  scoreIdentityTuple: {
    verdict: "PASS" | "AMBER" | "FAIL" | "CONFLICT";
    trustScore: number;
    citeabilityScore: number;
    tupleHash: string;
  };
  refs: {
    trustSummaryUrl: string;
    proofBundleUrl: string;
    explainUrl: string;
    trustVerdictUrl: string;
  };
}