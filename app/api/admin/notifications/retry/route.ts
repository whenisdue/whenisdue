import { getAdminSession } from "@/lib/admin-session"; 
import { triggerManualRecovery } from "@/src/services/notifications/admin-actions";
import { RecoveryOutcome } from "@/src/services/notifications/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Verify Admin Session
  const session = await getAdminSession();
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { outboxId, reason } = await req.json();

    if (!outboxId || !reason) {
      return NextResponse.json({ error: "Missing outboxId or reason" }, { status: 400 });
    }

    // 2. Execute Recovery
    const outcome = await triggerManualRecovery({
      outboxId,
      adminId: session.sub,
      reason,
    });

    // 3. Map Outcome to HTTP Status
    const statusMap: Record<RecoveryOutcome, number> = {
      [RecoveryOutcome.ACCEPTED]: 200,
      [RecoveryOutcome.NOT_FOUND]: 404,
      [RecoveryOutcome.INVALID_STATE]: 409,
      [RecoveryOutcome.AUTH_FAILURE]: 403,
      [RecoveryOutcome.INTERNAL_ERROR]: 500,
    };

    return NextResponse.json({ outcome }, { status: statusMap[outcome] });

  } catch (error) {
    console.error("[RETRY_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}