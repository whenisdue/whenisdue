import { OpsEvent } from '../../types/ops-journal';

export type ConflictUiState = 
  | "PUBLISHED" 
  | "DETECTED_UNTOUCHED" 
  | "TRIAGE_IN_PROGRESS" 
  | "BLOCKED_RECOVERY_NEEDED" 
  | "AWAITING_EXTERNAL_PUBLISH" 
  | "UNKNOWN_STATE";

/**
 * DERIVE_CONFLICT_STATE
 * Pure function to determine where a conflict stands based on immutable artifacts.
 */
export function deriveConflictState(
  conflictId: string, 
  journal: OpsEvent[], 
  publicResolutions: any[]
): ConflictUiState {
  // 1. Check if already published (Terminal State)
  const isResolved = publicResolutions.find(r => r.conflictId === conflictId);
  if (isResolved) return "PUBLISHED";

  // 2. Filter journal for this conflict
  // Since only DRAFT_INITIALIZED explicitly has conflictId, we find the draftIds first.
  const associatedDraftIds = new Set(
    journal
      .filter((e) => e.eventType === "DRAFT_INITIALIZED" && e.conflictId === conflictId)
      .map((e) => e.draftId)
  );

  // Grab all events that reference those draftIds
  const relevantEvents = journal.filter((e) => associatedDraftIds.has(e.draftId));

  if (relevantEvents.length === 0) return "DETECTED_UNTOUCHED";

  // 3. Find the latest active event
  // (Assuming the journal is chronologically ordered as an append-only log)
  const latestEvent = relevantEvents[relevantEvents.length - 1];
  
  // 4. Map event to UI state
  switch (latestEvent.eventType) {
    case "GATE_FAILURE": 
      return "BLOCKED_RECOVERY_NEEDED";
    case "DRAFT_INITIALIZED": 
    case "RECOVERY_ACTION":
      return "TRIAGE_IN_PROGRESS";
    case "PUBLISH_INTENT_EXPORTED": 
      return "AWAITING_EXTERNAL_PUBLISH";
    default: 
      return "UNKNOWN_STATE";
  }
}