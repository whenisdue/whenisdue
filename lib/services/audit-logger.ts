import { IntegrityLogger } from "./subscription-service";

export const auditLogger: IntegrityLogger = {
  logAnomaly(event, context) {
    // Audit-grade: In production, send to Datadog/Sentry/CloudWatch
    console.warn(JSON.stringify({
      level: 'CRITICAL',
      source: 'SubscriptionService',
      event,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
};