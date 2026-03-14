import { STATE_NAMES } from "@/lib/constants";
import { STATE_PROGRAM_PROFILES } from "@/lib/schedule/identifier-config";

export type IntentClass = 'EXACT_PAYMENT' | 'PARTIAL_GUIDANCE' | 'UNKNOWN';

export interface SearchIntent {
  stateCode: string | null;
  programCode: 'SNAP';
  identifierKind: string | null;
  identifierValue: string | null;
  benefitMonth: number;
  benefitYear: number;
  canonicalKey: string;
  intentClass: IntentClass;
}

const AMBIGUOUS_CODES = ['IN', 'OR', 'ME', 'HI', 'AL', 'AS', 'CO', 'LA', 'OH'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function normalizeQuery(rawQuery: string): SearchIntent {
  const q = rawQuery.toLowerCase().trim();
  const tokens = q.split(/\s+/);
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // 1. STATE DETECTION (Token-Aware)
  let stateCode: string | null = null;
  for (const entry of Object.entries(STATE_NAMES)) {
    const code = entry[0] as string;
    const name = entry[1] as string;
    const nameRegex = new RegExp(`\\b${name.toLowerCase()}\\b`, 'i');
    if (nameRegex.test(q) || (tokens.includes(code.toLowerCase()) && (!AMBIGUOUS_CODES.includes(code) || tokens.length === 1))) {
      stateCode = code;
      break;
    }
  }

  const programCode = 'SNAP';
  const profileKey = stateCode ? `${stateCode}_${programCode}` : null;
  const identifierKind = profileKey ? STATE_PROGRAM_PROFILES[profileKey] || null : null;

  // 2. TEMPORAL CONTEXT STRIPPING (Final Auditor Fix)
  // We identify numbers that are likely years OR adjacent to month names
  const allNumbers = q.match(/\b\d+\b/g) || [];
  const temporalNumbers = new Set<string>();

  // A. Check for 4-digit years
  allNumbers.forEach(n => {
    const val = parseInt(n, 10);
    if (val >= currentYear - 1 && val <= currentYear + 5) temporalNumbers.add(n);
  });

  // B. Check for Month-Adjacent Days (e.g., "March 15" or "15 March")
  tokens.forEach((token, i) => {
    if (MONTHS.includes(token)) {
      // Check token before
      if (i > 0 && /^\d+$/.test(tokens[i - 1])) temporalNumbers.add(tokens[i - 1]);
      // Check token after
      if (i < tokens.length - 1 && /^\d+$/.test(tokens[i + 1])) temporalNumbers.add(tokens[i + 1]);
    }
  });

  // 3. PHRASE-AWARE IDENTIFIER EXTRACTION
  let identifierValue: string | null = null;

  const numericPhraseRegex = /(?:ending in|last digit|case number|case #|digit|suffix)\s*([0-9]+)/i;
  const alphaPhraseRegex = /(?:last name|initial|letter)\s*([a-z])/i;

  const numMatch = q.match(numericPhraseRegex);
  const alphaMatch = q.match(alphaPhraseRegex);

  if (numMatch) {
    identifierValue = numMatch[1];
  } else if (alphaMatch) {
    identifierValue = alphaMatch[1].toUpperCase();
  } else {
    // FALLBACK: Filter out all identified temporal context
    const plausibleIdentifiers = allNumbers.filter(n => !temporalNumbers.has(n));

    // Bare numeric fallback ONLY if exactly one plausible candidate survives
    if (plausibleIdentifiers.length === 1) {
      identifierValue = plausibleIdentifiers[0];
    } else if (identifierKind && (identifierKind.includes("ALPHA") || identifierKind.includes("INITIAL"))) {
      const singleLetters = tokens.filter(t => t.length === 1 && /[a-z]/i.test(t));
      if (singleLetters.length === 1) {
        identifierValue = singleLetters[0].toUpperCase();
      }
    }
  }

  // 4. INTENT CLASSIFICATION
  let intentClass: IntentClass = 'UNKNOWN';
  if (stateCode && identifierValue && identifierKind) {
    intentClass = 'EXACT_PAYMENT';
  } else if (stateCode) {
    intentClass = 'PARTIAL_GUIDANCE';
  }

  const benefitMonth = now.getMonth() + 1;
  const benefitYear = currentYear;
  const canonicalKey = `${stateCode || 'XX'}|${programCode}|${identifierKind || 'XX'}|${identifierValue || 'XX'}|${benefitYear}|${benefitMonth}`;

  return {
    stateCode,
    programCode,
    identifierKind,
    identifierValue,
    benefitMonth,
    benefitYear,
    canonicalKey,
    intentClass
  };
}