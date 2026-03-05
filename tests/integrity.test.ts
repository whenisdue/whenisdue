import { test } from 'node:test';
import assert from 'node:assert';
import { calculateCci } from '../lib/patternAggregation';

test('CCI Calculation Integrity', () => {
  // Mock dates: Nintendo Direct example (June 15, 18, 21)
  const dates = ["2021-06-15", "2022-06-18", "2023-06-21"];
  
  const result = calculateCci(dates, "test-series");
  
  assert.ok(result.eligible, "Should be eligible with 3 dates");
  assert.ok(result.cci >= 0 && result.cci <= 1, "CCI should be between 0 and 1");
  assert.strictEqual(result.cycleCount, 3);
  assert.strictEqual(result.topMonth, 5); // June is month 5 (0-indexed)
  
  // Edge case: < 3 dates
  const fewDates = ["2023-06-21"];
  const resultLow = calculateCci(fewDates);
  assert.strictEqual(resultLow.lowEvidence, true, "Should flag low evidence");
  assert.ok(resultLow.cci <= 0.55, "Should cap score for low evidence");
});