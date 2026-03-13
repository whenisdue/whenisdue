// RESEARCH APPLIED: Batch 2, Tab 2 (Identifier Metadata Registry)
// RESEARCH APPLIED: Batch 2, Tab 3 (Centralized Presentation Resolver)

export type IdentifierKind = 
  | "case_last_digit"
  | "case_last_two_digits"
  | "case_transformed_two_digit"
  | "edg_last_two_digits"
  | "ssn_last_two_digits"
  | "region_group";

export type IdentifierKindMeta = {
  columnHeader: string;
  shortLabel: string;
  description: string;
  textAlign: "left" | "center" | "right";
};

export const IDENTIFIER_REGISTRY: Record<IdentifierKind, IdentifierKindMeta> = {
  case_last_digit: {
    columnHeader: "Case Number Last Digit",
    shortLabel: "Case Digit",
    description: "The final digit of your state case number.",
    textAlign: "center",
  },
  case_last_two_digits: {
    columnHeader: "Case Number (Last 2 Digits)",
    shortLabel: "Case Last 2",
    description: "The final two digits of your state case number.",
    textAlign: "center",
  },
  case_transformed_two_digit: {
    columnHeader: "Case Lookup Value",
    shortLabel: "Lookup Value",
    description: "Derived from the 9th and 8th digits of your case number, read backwards.",
    textAlign: "center",
  },
  edg_last_two_digits: {
    columnHeader: "EDG Number (Last 2 Digits)",
    shortLabel: "EDG Last 2",
    description: "The last two digits of your Eligibility Determination Group (EDG) number.",
    textAlign: "center",
  },
  ssn_last_two_digits: {
    columnHeader: "SSN (Last 2 Digits)",
    shortLabel: "SSN Last 2",
    description: "The last two digits of the primary cardholder's Social Security Number.",
    textAlign: "center",
  },
  region_group: {
    columnHeader: "Region / County",
    shortLabel: "Region",
    description: "The geographic or administrative group handling your case.",
    textAlign: "left",
  },
};

export function getIdentifierMeta(kind: string): IdentifierKindMeta {
  // Fallback to a safe default if a new state introduces an unknown kind
  return IDENTIFIER_REGISTRY[kind as IdentifierKind] || {
    columnHeader: "Identifier Group",
    shortLabel: "Group",
    description: "Your specific payment group.",
    textAlign: "center",
  };
}