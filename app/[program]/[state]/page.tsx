// RESEARCH APPLIED: Batch 3, Tab 5 (Dynamic metadata, canonical URLs)
// RESEARCH APPLIED: Batch 3, Tab 6 (JSON-LD Schema Graph: WebPage + BreadcrumbList + Dataset)
// RESEARCH APPLIED: Batch 3, Tab 8 (Canonicalize to prevent duplicate identifier pages)
// RESEARCH APPLIED: Batch 3, Tab 10 (Server shell + main schedule data)

import { Metadata } from "next";
import StateScheduleView from "@/components/schedule/StateScheduleView";
import { SmartSearchBox } from "@/components/search/SmartSearchBox";

interface PageProps {
  params: Promise<{
    program: string; // e.g., "snap"
    state: string;   // e.g., "texas"
  }>;
}

// Map slugs to human-readable names
const stateMap: Record<string, { code: string; name: string }> = {
  "alabama": { code: "AL", name: "Alabama" },
  "florida": { code: "FL", name: "Florida" },
  "georgia": { code: "GA", name: "Georgia" },
  "california": { code: "CA", name: "California" },
  "texas": { code: "TX", name: "Texas" },
  "new-york": { code: "NY", name: "New York" },
  "tennessee": { code: "TN", name: "Tennessee" },
  "ohio": { code: "OH", name: "Ohio" },
  "north-carolina": { code: "NC", name: "North Carolina" },
  "arizona": { code: "AZ", name: "Arizona" },
  "virginia": { code: "VA", name: "Virginia" },
  "michigan": { code: "MI", name: "Michigan" },
  "indiana": { code: "IN", name: "Indiana" },
};

// 1. DYNAMIC METADATA GENERATOR
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const stateInfo = stateMap[resolvedParams.state.toLowerCase()];
  const programName = resolvedParams.program.toUpperCase();
  
  if (!stateInfo) return { title: "Schedule Not Found" };

  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
  
  // Enforce strict canonical URL to prevent faceted duplicate indexing
  const canonicalPath = `https://whenisdue.com/${resolvedParams.program}/${resolvedParams.state}`;

  return {
    title: `${stateInfo.name} ${programName} Payment Schedule for ${monthLabel}`,
    description: `Officially sourced ${stateInfo.name} ${programName} payment schedule reference for ${monthLabel}, including identifier groups, payment dates, and timing notes.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${stateInfo.name} ${programName} Payment Schedule`,
      description: `Check the official ${stateInfo.name} ${programName} payment schedule, deposit timing details, and rule groups for this month.`,
      url: canonicalPath,
    }
  };
}

// 2. THE SERVER COMPONENT PAGE SHELL
export default async function ProgramStatePage({ params }: PageProps) {
  const resolvedParams = await params;
  
  const stateInfo = stateMap[resolvedParams.state.toLowerCase()];
  const programName = resolvedParams.program.toUpperCase();

  if (!stateInfo) {
    return <div className="p-10 text-center text-xl">State not found.</div>;
  }

  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
  const canonicalUrl = `https://whenisdue.com/${resolvedParams.program}/${resolvedParams.state}`;

  // 3. THE JSON-LD GRAPH
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": `${stateInfo.name} ${programName} Payment Schedule for ${monthLabel}`,
        "description": `Structured monthly ${stateInfo.name} ${programName} schedule data.`,
        "breadcrumb": {
          "@id": `${canonicalUrl}#breadcrumb`
        },
        "mainEntity": {
          "@id": `${canonicalUrl}#dataset`
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://whenisdue.com" },
          { "@type": "ListItem", "position": 2, "name": `${programName} Schedules`, "item": `https://whenisdue.com/${resolvedParams.program}` },
          { "@type": "ListItem", "position": 3, "name": stateInfo.name, "item": canonicalUrl }
        ]
      },
      {
        "@type": "Dataset",
        "@id": `${canonicalUrl}#dataset`,
        "name": `${stateInfo.name} ${programName} payment schedule dataset for ${monthLabel}`,
        "description": "Structured monthly schedule data with identifier groups and corresponding payment dates.",
        "url": canonicalUrl,
        "temporalCoverage": `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01/..`,
        "variableMeasured": [
          { "@type": "PropertyValue", "name": "Identifier group" },
          { "@type": "PropertyValue", "name": "Payment date" }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white">
      {/* INJECT JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER SECTION */}
      <header className="bg-blue-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {stateInfo.name} {programName} Payment Schedule
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mb-8">
            Find your exact {monthLabel} deposit date using the official schedule below.
          </p>
          
          {/* CLIENT ISLAND: The Smart Search Dropdown */}
          <div className="w-full max-w-lg">
            <label className="block text-sm font-medium text-blue-100 mb-2">Quick Lookup</label>
            <SmartSearchBox />
          </div>
        </div>
      </header>

      {/* SCHEDULE VIEW (Handles Data Fetching, Trust Badges, and Table) */}
      <section className="px-6">
        <StateScheduleView 
          stateCode={stateInfo.code} 
          stateName={stateInfo.name} 
          programCode={programName} 
        />
      </section>
    </main>
  );
}