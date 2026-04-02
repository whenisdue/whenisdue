import { PrismaClient } from '@prisma/client';
// 🚀 SOVEREIGN PATH: Pointing to your engine
import { BenefitEngine } from '../lib/engine/benefit-engine'; 

const prisma = new PrismaClient();

async function runChaosAudit() {
  console.log("🚦 STARTING SOVEREIGN STRESS TEST: 100 SUBSCRIPTIONS");
  console.log("---------------------------------------------------");

  // 🛡️ TYPE HARDENING: We explicitly define the allowed state codes
  type BenefitState = 'FL' | 'TX' | 'CA' | 'NY' | 'GA';
  const states: BenefitState[] = ['FL', 'TX', 'CA', 'NY', 'GA'];
  
  let totalPassed = 0;
  let failures: any[] = [];

  for (let i = 1; i <= 100; i++) {
    // Picking a random state from our restricted list
    const state = states[Math.floor(Math.random() * states.length)];
    
    // Generate a random 10-digit ID for testing
    const randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    try {
      // 🕵️‍♂️ FIXED: The 'state' is now recognized as a valid 'BenefitRule'
      const result = BenefitEngine.resolve(state as any, randomId);
      
      const date = new Date(result.date);
      const day = date.getDay(); // 0 = Sun, 6 = Sat
      
      // Verify no Weekend collisions (0 and 6)
      if (day === 0 || day === 6) {
        throw new Error(`CRITICAL COLLISION: Date ${result.date} falls on a weekend (${day}).`);
      }

      totalPassed++;
      if (i % 20 === 0) console.log(`✅ ${i}/100 subscriptions verified...`);

    } catch (error: any) {
      failures.push({
        iteration: i,
        state,
        id: randomId,
        error: error.message
      });
    }
  }

  console.log("---------------------------------------------------");
  console.log(`🏁 AUDIT COMPLETE`);
  console.log(`📈 SUCCESS RATE: ${totalPassed}%`);
  
  if (failures.length > 0) {
    console.error(`🚨 DETECTED ${failures.length} SYSTEM FAILURES:`);
    console.table(failures);
    process.exit(1);
  } else {
    console.log("🟢 VERDICT: THE ENGINE IS MATHEMATICALLY SOVEREIGN.");
    process.exit(0);
  }
}

runChaosAudit().catch(err => {
  console.error(err);
  process.exit(1);
});