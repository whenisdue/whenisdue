import { notFound } from "next/navigation";
import { getRuleLineage } from "@/lib/search/audit-service";
import BitemporalAuditController from "@/components/admin/BitemporalAuditController";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    stateCode: string;
    programCode: string;
  };
}

export default async function AuditPage({ params }: PageProps) {
  const stateCode = params.stateCode.toUpperCase();
  const programCode = params.programCode.toUpperCase();

  // 1. Fetch the raw Prisma lineage
  const rawLineage = await getRuleLineage(stateCode, programCode);

  if (!rawLineage) {
    return notFound();
  }

  // 2. Map Prisma models to the VersionNode interface expected by the UI
  const lineage = rawLineage.map(rule => ({
    id: rule.id,
    versionNumber: rule.versionNumber,
    status: rule.status,
    recordedFrom: rule.recordedFrom.toISOString(),
    recordedTo: rule.recordedTo ? rule.recordedTo.toISOString() : null,
    validFrom: rule.validFrom.toISOString(),
    validTo: rule.validTo ? rule.validTo.toISOString() : null,
    changeReason: rule.changeReason || "",
    verifiedBy: rule.verifiedBy || "System Admin",
    sourceAuthority: rule.sourceAuthority,
    sourceUrl: rule.sourceUrl,
    eventCount: rule._count.paymentEvents,
    identifierKind: rule.identifierKind,
    holidayPolicy: rule.holidayPolicy,
    issuanceWindow: rule.issuanceWindow
  }));

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Bitemporal Ledger Audit
        </h1>
        <p className="text-slate-500 font-medium">
          Viewing schedule truth lineage for <span className="font-bold text-slate-900">{stateCode} {programCode}</span>
        </p>
      </div>

      <BitemporalAuditController 
        stateCode={stateCode}
        programCode={programCode}
        lineage={lineage} 
      />
    </div>
  );
}