import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old schedule rules...');
  await prisma.paymentEvent.deleteMany();
  await prisma.scheduleRule.deleteMany();

  console.log('Seeding Programmatic Logic Engine with Full Caseworker Sequences...');

  // ==========================================
  // ALABAMA SNAP (Full 20-Bucket Sequence)
  // ==========================================
  await prisma.scheduleRule.create({
    data: {
      state: 'AL',
      program: 'SNAP',
      ruleType: 'DIGIT_RANGE_BUCKET',
      identifierKind: 'case_last_two_digits',
      logicPayload: {
        bucketMap: [
          { lookupMin: 0, lookupMax: 4, depositDay: 4 },
          { lookupMin: 5, lookupMax: 9, depositDay: 5 },
          { lookupMin: 10, lookupMax: 14, depositDay: 6 },
          { lookupMin: 15, lookupMax: 19, depositDay: 7 },
          { lookupMin: 20, lookupMax: 24, depositDay: 8 },
          { lookupMin: 25, lookupMax: 29, depositDay: 9 },
          { lookupMin: 30, lookupMax: 34, depositDay: 10 },
          { lookupMin: 35, lookupMax: 39, depositDay: 11 },
          { lookupMin: 40, lookupMax: 44, depositDay: 12 },
          { lookupMin: 45, lookupMax: 49, depositDay: 13 },
          { lookupMin: 50, lookupMax: 54, depositDay: 14 },
          { lookupMin: 55, lookupMax: 59, depositDay: 15 },
          { lookupMin: 60, lookupMax: 64, depositDay: 16 },
          { lookupMin: 65, lookupMax: 69, depositDay: 17 },
          { lookupMin: 70, lookupMax: 74, depositDay: 18 },
          { lookupMin: 75, lookupMax: 79, depositDay: 19 },
          { lookupMin: 80, lookupMax: 84, depositDay: 20 },
          { lookupMin: 85, lookupMax: 89, depositDay: 21 },
          { lookupMin: 90, lookupMax: 94, depositDay: 22 },
          { lookupMin: 95, lookupMax: 99, depositDay: 23 }
        ]
      },
      calendarPolicy: {
        weekendHandling: "no_shift",
        holidayHandling: "no_shift"
      }
    }
  });

  // ==========================================
  // FLORIDA SNAP (Full 28-Bucket Sequence)
  // ==========================================
  await prisma.scheduleRule.create({
    data: {
      state: 'FL',
      program: 'SNAP',
      ruleType: 'POSITIONAL_DIGIT_SEQUENCE',
      identifierKind: 'case_transformed_two_digit', 
      logicPayload: {
        bucketMap: [
          { lookupMin: 0, lookupMax: 3, depositDay: 1 },
          { lookupMin: 4, lookupMax: 6, depositDay: 2 },
          { lookupMin: 7, lookupMax: 10, depositDay: 3 },
          { lookupMin: 11, lookupMax: 13, depositDay: 4 },
          { lookupMin: 14, lookupMax: 17, depositDay: 5 },
          { lookupMin: 18, lookupMax: 20, depositDay: 6 },
          { lookupMin: 21, lookupMax: 24, depositDay: 7 },
          { lookupMin: 25, lookupMax: 27, depositDay: 8 },
          { lookupMin: 28, lookupMax: 31, depositDay: 9 },
          { lookupMin: 32, lookupMax: 34, depositDay: 10 },
          { lookupMin: 35, lookupMax: 38, depositDay: 11 },
          { lookupMin: 39, lookupMax: 41, depositDay: 12 },
          { lookupMin: 42, lookupMax: 45, depositDay: 13 },
          { lookupMin: 46, lookupMax: 48, depositDay: 14 },
          { lookupMin: 49, lookupMax: 53, depositDay: 15 },
          { lookupMin: 54, lookupMax: 57, depositDay: 16 },
          { lookupMin: 58, lookupMax: 60, depositDay: 17 },
          { lookupMin: 61, lookupMax: 64, depositDay: 18 },
          { lookupMin: 65, lookupMax: 67, depositDay: 19 },
          { lookupMin: 68, lookupMax: 71, depositDay: 20 },
          { lookupMin: 72, lookupMax: 74, depositDay: 21 },
          { lookupMin: 75, lookupMax: 78, depositDay: 22 },
          { lookupMin: 79, lookupMax: 81, depositDay: 23 },
          { lookupMin: 82, lookupMax: 85, depositDay: 24 },
          { lookupMin: 86, lookupMax: 88, depositDay: 25 },
          { lookupMin: 89, lookupMax: 92, depositDay: 26 },
          { lookupMin: 93, lookupMax: 95, depositDay: 27 },
          { lookupMin: 96, lookupMax: 99, depositDay: 28 }
        ]
      },
      calendarPolicy: {
        weekendHandling: "no_shift",
        holidayHandling: "no_shift"
      }
    }
  });

  // ==========================================
  // GEORGIA SNAP (Full 10-Bucket Sequence)
  // RESEARCH APPLIED: Batch 1, Topics 13-17
  // ==========================================
  await prisma.scheduleRule.create({
    data: {
      state: 'GA',
      program: 'SNAP',
      ruleType: 'DIGIT_RANGE_BUCKET',
      identifierKind: 'client_id_last_two',
      logicPayload: {
        bucketMap: [
          { lookupMin: 0, lookupMax: 9, depositDay: 5 },
          { lookupMin: 10, lookupMax: 19, depositDay: 7 },
          { lookupMin: 20, lookupMax: 29, depositDay: 9 },
          { lookupMin: 30, lookupMax: 39, depositDay: 11 },
          { lookupMin: 40, lookupMax: 49, depositDay: 13 },
          { lookupMin: 50, lookupMax: 59, depositDay: 15 },
          { lookupMin: 60, lookupMax: 69, depositDay: 17 },
          { lookupMin: 70, lookupMax: 79, depositDay: 19 },
          { lookupMin: 80, lookupMax: 89, depositDay: 21 },
          { lookupMin: 90, lookupMax: 99, depositDay: 23 }
        ]
      },
      calendarPolicy: {
        weekendHandling: "no_shift",
        holidayHandling: "no_shift"
      }
    }
  });

  console.log('✅ Rules seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });