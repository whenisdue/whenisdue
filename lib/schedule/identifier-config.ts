export type IdentifierUiConfig = {
  prompt: string;
  helperText: string;
  label: string;
  uiMode: "keypad" | "text";
  validationType: "numeric" | "alpha" | "none";
  maxLength?: number;
};

// Deterministic Profile Map (Safe state-to-rule lookup)
export const STATE_PROGRAM_PROFILES: Record<string, string> = {
  "AL_SNAP": "CASE_LAST_TWO_DIGITS",
  "FL_SNAP": "CASE_TRANSFORMED_TWO_DIGIT",
  "GA_SNAP": "CLIENT_ID_LAST_TWO",
  "CA_SNAP": "CASE_NUMBER_LAST_DIGIT",
  "TX_SNAP": "EDG_LAST_TWO_DIGITS",
  "NY_SNAP": "CASE_NUMBER_LAST_DIGIT",
  "PA_SNAP": "CASE_RECORD_LAST_DIGIT",
  "IL_SNAP": "HOH_IIN_LAST_DIGIT",
  "OH_SNAP": "CASE_NUMBER_LAST_DIGIT",
  "NC_SNAP": "SSN_LAST_DIGIT",
  "WA_SNAP": "ASSIGNED_ISSUANCE_DAY",
  "AZ_SNAP": "LAST_NAME_INITIAL",
  "VA_SNAP": "CASE_NUMBER_LAST_DIGIT",
  "MI_SNAP": "RECIPIENT_ID_LAST_DIGIT",
  "IN_SNAP": "LAST_NAME_INITIAL",
  "TN_SNAP": "SSN_LAST_TWO_DIGITS"
};

export const IDENTIFIER_MAP: Record<string, IdentifierUiConfig> = {
  CASE_NUMBER_LAST_DIGIT: {
    prompt: "What is the last digit of your case number?",
    helperText: "Tap the single digit below.",
    label: "Case Digit",
    uiMode: "keypad",
    validationType: "numeric",
    maxLength: 1
  },
  EDG_LAST_TWO_DIGITS: {
    prompt: "What are the last 2 digits of your EDG number?",
    helperText: "Enter the two digits below.",
    label: "EDG Last Two",
    uiMode: "text",
    validationType: "numeric",
    maxLength: 2
  },
  SSN_LAST_DIGIT: {
    prompt: "What is the last digit of your SSN?",
    helperText: "Tap the single digit below.",
    label: "SSN Last Digit",
    uiMode: "keypad",
    validationType: "numeric",
    maxLength: 1
  },
  LAST_NAME_INITIAL: {
    prompt: "What is the first letter of your last name?",
    helperText: "Enter a single letter.",
    label: "Last Name Initial",
    uiMode: "text",
    validationType: "alpha",
    maxLength: 1
  }
};

export const getIdentifierConfig = (kind: string): IdentifierUiConfig => {
  return IDENTIFIER_MAP[kind.toUpperCase()] || {
    prompt: "Enter your identifier",
    helperText: "Type your detail below.",
    label: "Identifier",
    uiMode: "text",
    validationType: "none"
  };
};