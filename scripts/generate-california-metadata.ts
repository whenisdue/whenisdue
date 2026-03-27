import fs from 'fs';

const year = 2026;
const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const metadata: Record<string, any> = {};

months.forEach((m, idx) => {
  const monthName = monthNames[idx];
  for (let i = 0; i <= 99; i++) {
    const dStr = i.toString().padStart(2, '0');
    // 🛡️ FIX: Removed the "-s" before ${year}
    const slug = `california-snap-d${dStr}-m${m}-${year}`;
    
    metadata[slug] = {
      seoTitle: `California SNAP (CalFresh) ${monthName} ${year} — Case Ending in ${dStr}`,
      seoDescription: `Verified CalFresh (SNAP) deposit date for ${monthName} ${year}. This schedule applies to California case numbers ending in ${dStr}.`,
      keywords: `California CalFresh dates ${monthName} 2026, California SNAP schedule, CalFresh deposit case ending in ${dStr}`
    };
  }
});

if (!fs.existsSync('./data')) { fs.mkdirSync('./data'); }
fs.writeFileSync('./data/california_seo_2026.json', JSON.stringify(metadata, null, 2));
console.log("✅ California Metadata Corrected.");