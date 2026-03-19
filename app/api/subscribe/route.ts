// web/app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { auditLogger } from "@/lib/services/audit-logger";

const subService = new SubscriptionService(auditLogger);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const result = await subService.subscribe({
      email: body.email,
      stateCode: body.stateCode,
      programCode: body.programCode,
      matchType: body.matchType,
      rawInput: body.matchValue // This comes from your form input
    });

    switch (result.type) {
      case 'SUCCESS':
        return NextResponse.json({ message: "Subscribed successfully!" }, { status: 201 });
      
      case 'ALREADY_ACTIVE':
        return NextResponse.json({ message: "You are already subscribed to this benefit." }, { status: 200 });
      
      case 'ALREADY_PAUSED':
        return NextResponse.json({ message: "Your subscription is currently paused. Would you like to resume?" }, { status: 200 });

      case 'INVALID_INPUT':
        return NextResponse.json({ error: result.message }, { status: 400 });

      default:
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}