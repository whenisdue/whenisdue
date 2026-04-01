// web/lib/engine/normalization.ts

export class IdentifierNormalization {
  /**
   * Florida Logic: 9th & 8th digits of a 10-digit case number, reversed.
   * String:  1 2 3 4 5 6 7 8 9 0
   * Index:   0 1 2 3 4 5 6 7 8 9
   * Result:  "98" (Index 8 then Index 7)
   */
  static forFlorida(caseNumber: string): string {
    const clean = caseNumber.replace(/\D/g, '');
    if (clean.length !== 10) {
      throw new Error("FLORIDA_VALIDATION_ERROR: Case number must be exactly 10 digits.");
    }
    const d8 = clean.charAt(7); // 8th digit (Index 7)
    const d9 = clean.charAt(8); // 9th digit (Index 8)
    
    // We return the reversed pair as a string to match our range map
    return `${d9}${d8}`; 
  }

  /**
   * Texas Logic: Last two digits of the EDG number.
   * Example: 1234567 -> "67"
   */
  static forTexas(edgNumber: string): string {
    const clean = edgNumber.replace(/\D/g, '');
    if (clean.length < 2) {
      throw new Error("TEXAS_VALIDATION_ERROR: EDG number must be at least 2 digits.");
    }
    return clean.slice(-2);
  }
}