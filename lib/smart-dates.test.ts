// Test 4: Sunday + Monday Holiday + NEAREST_BUSINESS_DAY
// Scenario: Target is Sunday. Monday is a Holiday.
// Prev Business Day: Friday (Dist: 2)
// Next Business Day: Tuesday (Dist: 2)
// Logic: Tie-break should return Friday.
import { calculateSmartDate } from "./smart-dates";
import { DateOffsetStrategy } from "@prisma/client";
const holidays = [new Date(2026, 3, 13)]; // Mocking Monday April 13 as a holiday
const test4 = calculateSmartDate(
  { baseDay: 12, offsetStrategy: "NEAREST_BUSINESS_DAY" }, 4, 2026
);
// April 12, 2026 is Sunday. 
// With tie-break PREV, should return Friday April 10.
console.assert(test4.getDate() === 10, "Test 4 Failed: Tie-break nearest should return Friday");