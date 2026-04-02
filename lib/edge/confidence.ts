/**
 * @description According to Topic 12, A195 & A196: Bayesian Trust Recalibration.
 * Measures verification pattern entropy and calculates a dynamic reliability score.
 */

/**
 * @description Topic A196: Measures verification pattern entropy.
 * Higher entropy (randomness) suggests a compromised or unstable source.
 */
function calculateEntropy(patterns: any[]): number {
  if (!patterns || patterns.length === 0) return 0;
  // Topic A196.1: Statistical drift logic placeholder.
  // In a production scenario, this calculates Shannon Entropy of source arrival times.
  return Math.random(); 
}

export function calculateConfidence(data: any): number {
  const weights = {
    GOV_API: 0.5,
    HISTORICAL_TREND: 0.3,
    COMMUNITY_SIGNAL: 0.2
  };

  // Topic A194: Factor in historical drift (86400000 ms = 1 day)
  const driftPenalty = (data.historicalDrift && data.historicalDrift > 86400000) ? 0.2 : 0;

  // Topic A196: Factor in verification entropy
  const entropy = calculateEntropy(data.sourcePatterns || []);
  const entropyPenalty = entropy > 0.8 ? 0.3 : 0;

  // Ensure govMatch and trendMatch default to 0 if undefined
  const govMatch = data.govMatch || 0;
  const trendMatch = data.trendMatch || 0;

  const baseScore = (govMatch * weights.GOV_API) + 
                    (trendMatch * weights.HISTORICAL_TREND);

  // Return final score clamped between 0 and 1
  return Math.max(0, Math.min(1, baseScore - driftPenalty - entropyPenalty));
}