export type ShiftCause = 'WEEKEND' | 'HOLIDAY' | 'BUSINESS_DAY' | 'NONE';
export type AppliedPolicy = 'PREVIOUS_BUSINESS_DAY' | 'NEXT_BUSINESS_DAY' | 'SAME_DAY' | 'NO_SHIFT';

export type ExactAnswerResponse = {
  type: 'EXACT_ANSWER';
  date: string;          // YYYY-MM-DD
  originalDate?: string; // YYYY-MM-DD
  isShifted: boolean;
  shiftCause: ShiftCause;
  appliedPolicy: AppliedPolicy;
  stateCode: string;
  stateName: string;
  program: string;
  identifierLabel: string;
  match: string;
  monthLabel: string;
  ruleVersion: string;
  sourceAuthority: string;
  sourceUrl: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  lastVerifiedAt?: string;
};

export type SearchResponse = 
  | ExactAnswerResponse
  | { type: 'PARTIAL_GUIDANCE'; stateName: string; program: string; message: string; examples: string[] }
  | { type: 'INVALID_IDENTIFIER'; stateName: string; program: string; expectedKind: string; validValues: string[]; message: string }
  | { type: 'NO_MATCH'; query: string }
  | { type: 'INTEGRITY_FAILURE'; query: string }
  | { type: 'SERVER_ERROR'; message: string };