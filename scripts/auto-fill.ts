import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// CONFIGURATION: Set to false ONLY when ready to write to DB
// ==========================================
const DRY_RUN = false; 

// The structured data payload
/////////////////////////////
/////////////////////////////
const BULK_STATE_DATA: Record<string, any> = {
  "Alaska": {
    whatToExpect: "Alaska SNAP benefits are issued on the 1st of every month for most households. However, if your application was processed recently, your date may vary based on the first letter of your last name.",
    scheduleRules: {
      headers: ["Last Name Group", "Deposit Date"],
      rows: [
        { identifier: "General Population", date: "April 1, 2026" },
        { identifier: "New Cases (A-E)", date: "April 1, 2026" },
        { identifier: "New Cases (F-L)", date: "April 2, 2026" },
        { identifier: "New Cases (M-R)", date: "April 3, 2026" },
        { identifier: "New Cases (S-Z)", date: "April 4, 2026" }
      ],
      footerNote: "The majority of Alaskans receive benefits on the 1st. Staggered dates only apply to specific new enrollment groups."
    }
  },
  "Arkansas": {
    whatToExpect: "Arkansas distributes SNAP benefits between the 4th and the 13th of the month. Your exact date is determined by the last digit of your Social Security Number.",
    scheduleRules: {
      headers: ["Last Digit of SSN", "Deposit Date"],
      rows: [
        { identifier: "0", date: "April 4, 2026" },
        { identifier: "1", date: "April 5, 2026" },
        { identifier: "2", date: "April 6, 2026" },
        { identifier: "3", date: "April 7, 2026" },
        { identifier: "4", date: "April 8, 2026" },
        { identifier: "5", date: "April 9, 2026" },
        { identifier: "6", date: "April 10, 2026" },
        { identifier: "7", date: "April 11, 2026" },
        { identifier: "8", date: "April 12, 2026" },
        { identifier: "9", date: "April 13, 2026" }
      ],
      footerNote: "If your SSN digit falls on a weekend, Arkansas still posts the payment on that exact calendar day."
    }
  },
  "Connecticut": {
    whatToExpect: "Connecticut issues SNAP benefits over the first 3 days of the month. Your date is based on the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – F", date: "April 1, 2026" },
        { identifier: "G – P", date: "April 2, 2026" },
        { identifier: "Q – Z", date: "April 3, 2026" }
      ],
      footerNote: "Connecticut's schedule is one of the fastest in the country, completing all disbursements by the 3rd."
    }
  },
  "Delaware": {
    whatToExpect: "Delaware distributes SNAP benefits over 15 to 22 days. Your exact date is based on the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – B", date: "April 2, 2026" },
        { identifier: "C – D", date: "April 3, 2026" },
        { identifier: "E – G", date: "April 4, 2026" },
        { identifier: "H – J", date: "April 5, 2026" }
      ],
      footerNote: "The schedule continues alphabetically until the letter Z on the 22nd."
    }
  },
  "Hawaii": {
    whatToExpect: "Hawaii issues SNAP benefits on the 3rd and 5th of every month. Your date is determined by the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – I", date: "April 3, 2026" },
        { identifier: "J – Z", date: "April 5, 2026" }
      ],
      footerNote: "Hawaii uses this simple two-day split for all islands."
    }
  },
  "Idaho": {
    whatToExpect: "Idaho SNAP benefits are distributed during the first 10 days of the month. The date corresponds to the last digit of your birth year.",
    scheduleRules: {
      headers: ["Last Digit of Birth Year", "Deposit Date"],
      rows: [
        { identifier: "1", date: "April 1, 2026" },
        { identifier: "2", date: "April 2, 2026" },
        { identifier: "3", date: "April 3, 2026" },
        { identifier: "4", date: "April 4, 2026" },
        { identifier: "5", date: "April 5, 2026" },
        { identifier: "6", date: "April 6, 2026" },
        { identifier: "7", date: "April 7, 2026" },
        { identifier: "8", date: "April 8, 2026" },
        { identifier: "9", date: "April 9, 2026" },
        { identifier: "0", date: "April 10, 2026" }
      ],
      footerNote: "If you were born in 1984, your last digit is 4, so you receive benefits on the 4th."
    }
  },
  "Iowa": {
    whatToExpect: "Iowa issues SNAP benefits from the 1st to the 10th of the month. Your date is determined by the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – B", date: "April 1, 2026" },
        { identifier: "C – D", date: "April 2, 2026" },
        { identifier: "E – G", date: "April 3, 2026" },
        { identifier: "H – J", date: "April 4, 2026" },
        { identifier: "K – L", date: "April 5, 2026" }
      ],
      footerNote: "The schedule concludes alphabetically with T-Z on the 10th."
    }
  },
  "Kansas": {
    whatToExpect: "Kansas distributes SNAP benefits between the 1st and the 10th of the month. Your exact date depends on the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – B", date: "April 1, 2026" },
        { identifier: "C – D", date: "April 2, 2026" },
        { identifier: "E – G", date: "April 3, 2026" }
      ],
      footerNote: "Alphabetical groups are strictly followed; contact DCF if your name has legally changed."
    }
  },
  "Maine": {
    whatToExpect: "Maine SNAP benefits are issued from the 10th to the 14th of the month based on the last digit of your birth date.",
    scheduleRules: {
      headers: ["Last Digit of Birth Date", "Deposit Date"],
      rows: [
        { identifier: "0 or 9", date: "April 10, 2026" },
        { identifier: "1 or 8", date: "April 11, 2026" },
        { identifier: "2 or 7", date: "April 12, 2026" },
        { identifier: "3 or 6", date: "April 13, 2026" },
        { identifier: "4 or 5", date: "April 14, 2026" }
      ],
      footerNote: "If you were born on the 23rd, your last digit is 3, making your date the 13th."
    }
  },
  "Maryland": {
    whatToExpect: "Maryland distributes SNAP benefits between the 4th and the 23rd of the month. Your date is based on the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A", date: "April 4, 2026" },
        { identifier: "B", date: "April 5, 2026" },
        { identifier: "C", date: "April 6, 2026" }
      ],
      footerNote: "The schedule continues daily through the alphabet, ending with Z on the 23rd."
    }
  },
  "Minnesota": {
    whatToExpect: "Minnesota issues SNAP benefits between the 4th and the 13th of the month. Your date is based on the last digit of your case number.",
    scheduleRules: {
      headers: ["Last Digit of Case Number", "Deposit Date"],
      rows: [
        { identifier: "4", date: "April 4, 2026" },
        { identifier: "5", date: "April 5, 2026" },
        { identifier: "6", date: "April 6, 2026" },
        { identifier: "7", date: "April 7, 2026" },
        { identifier: "8", date: "April 8, 2026" },
        { identifier: "9", date: "April 9, 2026" },
        { identifier: "0", date: "April 10, 2026" },
        { identifier: "1", date: "April 11, 2026" },
        { identifier: "2", date: "April 12, 2026" },
        { identifier: "3", date: "April 13, 2026" }
      ],
      footerNote: "Case numbers ending in 4 start the cycle on the 4th of each month."
    }
  },
  "Mississippi": {
    whatToExpect: "Mississippi SNAP benefits are issued from the 4th to the 21st of the month. Your date is based on the last two digits of your case number.",
    scheduleRules: {
      headers: ["Last 2 Digits of Case Number", "Deposit Date"],
      rows: [
        { identifier: "00–04", date: "April 4, 2026" },
        { identifier: "05–10", date: "April 5, 2026" }
      ],
      footerNote: "The pattern continues in increments of 5-6 digits until the 21st."
    }
  },
  "Montana": {
    whatToExpect: "Montana SNAP benefits are issued between the 2nd and the 6th of the month. Your date is based on the last digit of your case number.",
    scheduleRules: {
      headers: ["Last Digit of Case Number", "Deposit Date"],
      rows: [
        { identifier: "0 or 1", date: "April 2, 2026" },
        { identifier: "2 or 3", date: "April 3, 2026" },
        { identifier: "4 or 5", date: "April 4, 2026" },
        { identifier: "6 or 7", date: "April 5, 2026" },
        { identifier: "8 or 9", date: "April 6, 2026" }
      ],
      footerNote: "Montana has a very compressed 5-day issuance window."
    }
  },
  "Nebraska": {
    whatToExpect: "Nebraska issues SNAP benefits from the 1st to the 5th of the month based on the last digit of your Social Security Number.",
    scheduleRules: {
      headers: ["Last Digit of SSN", "Deposit Date"],
      rows: [
        { identifier: "1 or 2", date: "April 1, 2026" },
        { identifier: "3 or 4", date: "April 2, 2026" },
        { identifier: "5 or 6", date: "April 3, 2026" },
        { identifier: "7 or 8", date: "April 4, 2026" },
        { identifier: "9 or 0", date: "April 5, 2026" }
      ],
      footerNote: "Standard Nebraska schedule; dates do not shift for weekends."
    }
  },
  "Nevada": {
    whatToExpect: "Nevada SNAP benefits are issued over the first 10 days of the month based on the last digit of your case number.",
    scheduleRules: {
      headers: ["Last Digit of Case Number", "Deposit Date"],
      rows: [
        { identifier: "1", date: "April 1, 2026" },
        { identifier: "2", date: "April 2, 2026" },
        { identifier: "3", date: "April 3, 2026" },
        { identifier: "4", date: "April 4, 2026" },
        { identifier: "5", date: "April 5, 2026" },
        { identifier: "6", date: "April 6, 2026" },
        { identifier: "7", date: "April 7, 2026" },
        { identifier: "8", date: "April 8, 2026" },
        { identifier: "9", date: "April 9, 2026" },
        { identifier: "0", date: "April 10, 2026" }
      ],
      footerNote: "Funds are typically available by midnight on your scheduled date."
    }
  },
  "New Hampshire": {
    whatToExpect: "New Hampshire issues all SNAP benefits on the 1st or 5th of the month depending on your specific case type.",
    scheduleRules: {
      headers: ["Case Type", "Deposit Date"],
      rows: [
        { identifier: "Standard SNAP", date: "April 5, 2026" },
        { identifier: "Combined Assistance", date: "April 1, 2026" }
      ],
      footerNote: "Check your NH Easy account to confirm if you are in the 1st or 5th group."
    }
  },
  "North Dakota": {
    whatToExpect: "North Dakota issues all SNAP benefits on the 1st of every month.",
    scheduleRules: {
      headers: ["Group", "Deposit Date"],
      rows: [
        { identifier: "All Households", date: "April 1, 2026" }
      ],
      footerNote: "If the 1st is a holiday, benefits may be available on the last business day of the previous month."
    }
  },
  "Oklahoma": {
    whatToExpect: "Oklahoma distributes SNAP benefits from the 1st to the 10th of the month based on the last digit of your case number.",
    scheduleRules: {
      headers: ["Last Digit of Case Number", "Deposit Date"],
      rows: [
        { identifier: "0", date: "April 1, 2026" },
        { identifier: "1", date: "April 2, 2026" },
        { identifier: "2", date: "April 3, 2026" },
        { identifier: "3", date: "April 4, 2026" },
        { identifier: "4", date: "April 5, 2026" }
      ],
      footerNote: "The schedule continues through the 10th for digits 5-9."
    }
  },
  "Oregon": {
    whatToExpect: "Oregon SNAP benefits are issued from the 1st to the 9th of the month based on the last digit of your Social Security Number.",
    scheduleRules: {
      headers: ["Last Digit of SSN", "Deposit Date"],
      rows: [
        { identifier: "1", date: "April 1, 2026" },
        { identifier: "2", date: "April 2, 2026" },
        { identifier: "3", date: "April 3, 2026" }
      ],
      footerNote: "Digits 4-9 follow through the 9th of the month."
    }
  },
  "Rhode Island": {
    whatToExpect: "Rhode Island issues all SNAP benefits on the 1st of every month.",
    scheduleRules: {
      headers: ["Group", "Deposit Date"],
      rows: [
        { identifier: "All Households", date: "April 1, 2026" }
      ],
      footerNote: "Benefits are available at midnight on the first day of the month."
    }
  },
  "South Dakota": {
    whatToExpect: "South Dakota issues SNAP benefits on the 10th of every month for all households.",
    scheduleRules: {
      headers: ["Group", "Deposit Date"],
      rows: [
        { identifier: "All Households", date: "April 10, 2026" }
      ],
      footerNote: "Unlike other states, South Dakota uses a single fixed date later in the month."
    }
  },
  "Vermont": {
    whatToExpect: "Vermont issues all SNAP benefits on the 1st of every month.",
    scheduleRules: {
      headers: ["Group", "Deposit Date"],
      rows: [
        { identifier: "All Households", date: "April 1, 2026" }
      ],
      footerNote: "Standard statewide disbursement on the first calendar day."
    }
  },
  "West Virginia": {
    whatToExpect: "West Virginia distributes SNAP benefits from the 1st to the 9th based on the first letter of your last name.",
    scheduleRules: {
      headers: ["Last Name Starts With", "Deposit Date"],
      rows: [
        { identifier: "A – B", date: "April 1, 2026" },
        { identifier: "C – E", date: "April 2, 2026" }
      ],
      footerNote: "Alphabetical groups conclude with T-Z on the 9th."
    }
  },
  "Wyoming": {
    whatToExpect: "Wyoming SNAP benefits are issued over the first 4 days of the month based on the first letter of your last name.",
    scheduleRules: {
      headers: ["First Letter of Last Name", "Deposit Date"],
      rows: [
        { identifier: "A – D", date: "April 1, 2026" },
        { identifier: "E – K", date: "April 2, 2026" },
        { identifier: "L – R", date: "April 3, 2026" },
        { identifier: "S – Z", date: "April 4, 2026" }
      ],
      footerNote: "Wyoming provides one of the most compressed alphabetical schedules."
    }
  }
};
/////////////////////////////
/////////////////////////////
/////////////////////////////

// Layer 1: Structural Validation Function
function validatePayload(stateName: string, data: any) {
  if (!data.whatToExpect || typeof data.whatToExpect !== 'string') {
    throw new Error(`[VALIDATION FAILED] ${stateName}: Missing or invalid 'whatToExpect'`);
  }
  if (!data.scheduleRules?.headers || !Array.isArray(data.scheduleRules.headers)) {
    throw new Error(`[VALIDATION FAILED] ${stateName}: Missing or invalid 'headers' array`);
  }
  if (!data.scheduleRules?.rows || !Array.isArray(data.scheduleRules.rows)) {
    throw new Error(`[VALIDATION FAILED] ${stateName}: Missing or invalid 'rows' array`);
  }
}

async function main() {
  console.log(`\n=== STARTING BULK INGESTION PIPELINE ===`);
  console.log(`MODE: ${DRY_RUN ? '🟢 DRY RUN (No data will be modified)' : '🔴 LIVE PRODUCTION WRITE'}\n`);

  let matchedRecords = 0;
  let validationErrors = 0;

  try {
    // Layer 2: Atomic Transaction Wrapper (NOW WITH A 30-SECOND TIMEOUT!)
    await prisma.$transaction(async (tx) => {
      
      for (const [stateName, data] of Object.entries(BULK_STATE_DATA)) {
        
        // 1. Validate Shape
        try {
          validatePayload(stateName, data);
        } catch (error: any) {
          console.error(error.message);
          validationErrors++;
          continue; 
        }

        // 2. Find Canonical Record
        const stateEvent = await tx.event.findFirst({
          where: { category: "STATE", title: { startsWith: stateName } }
        });

        if (stateEvent) {
          matchedRecords++;
          
          if (DRY_RUN) {
            console.log(`[SIMULATION] Would update ${stateName} (ID: ${stateEvent.id})`);
            console.log(`   └─ Replacing rules with ${data.scheduleRules.rows.length} validated rows.\n`);
          } else {
            console.log(`[WRITING] Upserting data for ${stateName}...`);
            await tx.event.update({
              where: { id: stateEvent.id },
              data: {
                whatToExpect: data.whatToExpect,
                scheduleRules: data.scheduleRules,
              }
            });
          }
        } else {
          console.warn(`[WARNING] Database record for ${stateName} not found. Skipping.\n`);
        }
      }

      if (validationErrors > 0 && !DRY_RUN) {
        throw new Error(`\nABORTING TRANSACTION: ${validationErrors} validation errors detected. Production data was not modified.`);
      }

      if (DRY_RUN) {
        throw new Error("DRY RUN COMPLETE");
      }
      
    }, {
      timeout: 30000 // <--- THE FIX: 30 seconds instead of 5
    });

    console.log(`\n✅ LIVE TRANSACTION SUCCESSFUL. ${matchedRecords} records updated safely.`);

  } catch (error: any) {
    if (error.message === "DRY RUN COMPLETE") {
      console.log(`\n✅ DRY RUN FINISHED. ${matchedRecords} records validated. 0 records changed.`);
    } else {
      console.error(error.message);
      console.log("Database transaction rolled back successfully.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });