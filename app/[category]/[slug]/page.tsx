import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MapPin, Clock, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import EventTimeDisplay from "@/components/EventTimeDisplay";
import SmartCountdown from "@/components/SmartCountdown";
import Link from "next/link";
import AnalyticsTracker from '@/components/AnalyticsTracker'

// Import our new Deep Data UI Components
import ScheduleTable from "@/components/ScheduleTable";
import VisibleFAQ from "@/components/VisibleFAQ";
import  SubscribeWidget  from "@/components/SubscribeWidget";

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ category: string, slug: string }> }) {
  
  const { category, slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { series: true }
  });

  if (!event || event.category.toLowerCase() !== category.toLowerCase()) {
    notFound();
  }

  const status = event.dueAt ? (event.category === "FEDERAL" || event.category === "STATE" || event.series?.priorityWeight! > 8 ? "CONFIRMED" : "ESTIMATED") : "PENDING UPDATE";
  
  const statusStyles = {
    CONFIRMED: "bg-green-50 text-green-800 border-green-200",
    ESTIMATED: "bg-slate-100 text-slate-700 border-slate-300",
    "PENDING UPDATE": "bg-amber-50 text-amber-800 border-amber-200",
  };

  // PHASE 4 SEO: The "AI-Ready" Layered Schema Stack
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://whenisdue.com" },
          { "@type": "ListItem", "position": 2, "name": "Directory", "item": "https://whenisdue.com/agencies" },
          { "@type": "ListItem", "position": 3, "name": event.title, "item": `https://whenisdue.com/${event.category.toLowerCase()}/${event.slug}` }
        ]
      },
      {
        "@type": "GovernmentService",
        "name": event.series?.title || event.title,
        "provider": {
          "@type": "GovernmentOrganization",
          "name": event.series?.sourceName || "Official Agency"
        },
        "areaServed": {
          "@type": "Country",
          "name": "United States"
        }
      },
      {
        "@type": "Dataset",
        "name": `${event.title} - Schedule Data`,
        "description": event.whatToExpect || "Official disbursement schedule and settlement window.",
        "creator": {
          "@type": "Organization",
          "name": event.series?.sourceName || "Official Agency"
        },
        "dateModified": event.lastVerified ? event.lastVerified.toISOString() : new Date().toISOString()
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `When is the next ${event.title}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": event.dueAt ? `The next scheduled date is ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(event.dueAt)}.` : "The exact date is currently pending."
            }
          },
          {
            "@type": "Question",
            "name": "How long does bank processing take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "While funds are typically released by the Treasury at midnight, your bank may take up to 24-48 hours to post the deposit to your available balance."
            }
          }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* SILENT BEHAVIORAL TRACKER */}
      <AnalyticsTracker 
        stateName={event.title} 
        programName={event.category} 
      />

      {/* INVISIBLE SEO SCHEMA FOR GOOGLE & AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white border-b border-slate-200 pt-4 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Independent Reference Site • Not affiliated with any government agency
             </span>
          </div>
          {/* FUNCTIONAL BREADCRUMBS */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-blue-700 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href={`/agencies`} className="hover:text-blue-700 transition-colors">Directory</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 truncate max-w-[200px] sm:max-w-xs">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* HERO SECTION */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-10">
          <div className="p-8 md:p-12">
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
              {event.title}
            </h1>

            <div className="flex flex-col lg:flex-row justify-between gap-10">
              
              <div className="flex-1">
                {event.dueAt ? (
                  <EventTimeDisplay dueAt={event.dueAt} officialZone={event.timeZone || 'UTC'} isHero={true} />
                ) : (
                  <div className="text-4xl font-black text-slate-400 mb-2">DATE PENDING</div>
                )}

                <div className="flex items-center gap-2 mt-4 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md inline-flex self-start border border-slate-100">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Time localized to your device settings</span>
                </div>

                <div className="mt-8">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Record Status</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border ${statusStyles[status as keyof typeof statusStyles]}`}>
                    {status === 'CONFIRMED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status}
                  </div>
                </div>
              </div>

              {event.dueAt && (
                <div className="lg:border-l border-slate-100 lg:pl-10 flex flex-col justify-center min-w-[280px]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Expected Time Remaining</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 [&>div]:scale-[0.85] [&>div]:origin-left overflow-hidden">
                    <SmartCountdown dueAt={event.dueAt.toISOString()} />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* THE UTILITY: Subscribe box moved "Above the Fold" */}
          <div className="px-8 md:px-12 pb-8">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="text-lg font-bold text-blue-900 mb-1">Get Benefit Reminders</h3>
              <p className="text-sm text-blue-800 mb-5">Never miss a deposit. We'll email you 24 hours before your {event.category} benefits arrive.</p>
              <SubscribeWidget stateName={event.title} programName={event.category} ruleGroup={event.slug} />
            </div>
          </div>

          {/* SOURCE METADATA FOOTER */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Source:</span> 
                <a href="https://www.fns.usda.gov/sites/default/files/resource-files/Monthly-Issuance-Schedule-All-States.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline transition-colors">
                  {event.series?.sourceName || "Official Agency Record"}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Last verified: {event.lastVerified ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(event.lastVerified) : "Recently"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            THE NEW ANSWER-FIRST UX HIERARCHY 
            ========================================= */}
        
        <div className="max-w-3xl">
          
          {/* 1. Rule Explanation */}
          {event.whatToExpect && (
            <p className="text-xl text-slate-800 leading-relaxed font-medium mb-2">
              {event.whatToExpect}
            </p>
          )}

          {/* 2. Schedule Table Component - Tagged for Analytics Tracker */}
          <div id="schedule-table">
            <ScheduleTable data={event.scheduleRules as any} />
          </div>

          {/* 3. Reassurance / Processing Window */}
          {(event.category === "FEDERAL" || event.category === "STATE") && (
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
              <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">When deposits usually appear</h3>
                <p className="text-base text-blue-800 leading-relaxed">
                  Disbursement times can vary by financial institution. While the state sends payments early, your bank may take up to 24 hours to post the deposit to your available balance.
                </p>
              </div>
            </div>
          )}

          {/* 4. Visible FAQ Component */}
          <VisibleFAQ faqs={event.faqData as any} />

        </div>

      </div>
    </main>
  );
}