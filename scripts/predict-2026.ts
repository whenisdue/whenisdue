import { prisma } from '../lib/data-service';
import { getAdjustedPaymentDate } from '../lib/date-validator';

async function predictAll() {
  console.log("Wiping old predictions...");
  await prisma.occurrence.deleteMany({ where: { status: 'PREDICTED' } });

  const series = await prisma.series.findMany();

  for (const s of series) {
    for (let month = 0; month < 12; month++) {
      const predictedDate = getAdjustedPaymentDate(2026, month, s.occurrenceRule);
      
      await prisma.occurrence.upsert({
        where: { seriesId_date: { seriesId: s.id, date: predictedDate } },
        update: {},
        create: {
          seriesId: s.id,
          date: predictedDate,
          status: 'PREDICTED'
        }
      });
    }
  }
  console.log("✅ 2026 Prediction Engine Complete (Timezone Bug Destroyed).");
}

predictAll();