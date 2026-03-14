"use server";

import { getRulesetSnapshot, AuditContext } from "@/lib/search/audit-service";

export async function fetchServerTruthAtPIT(stateCode: string, programCode: string, asOfIso: string) {
  try {
    const ctx: AuditContext = { asOfDate: new Date(asOfIso) };
    const snapshot = await getRulesetSnapshot(stateCode, programCode, ctx);
    
    if (!snapshot) return { type: 'NO_TRUTH', message: "No active ruleset found for this exact moment in system history." };
    
    return { 
      type: 'TRUTH_FOUND', 
      versionNumber: snapshot.versionNumber,
      status: snapshot.status,
      id: snapshot.id 
    };
  } catch (error: any) {
    // Catches the BITEMPORAL_INTEGRITY_FAILURE from the service
    return { type: 'INTEGRITY_ERROR', message: error.message };
  }
}