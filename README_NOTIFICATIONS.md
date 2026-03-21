Notification Engine: Architecture & Operations
This project implements a Deterministic, At-Least-Once Delivery System for benefit deposit reminders. It is designed to be resilient, audit-ready, and idempotent.

🏗️ System Architecture
The engine operates as a two-stage relay race to ensure that no notification is ever lost or double-sent.

1. The Scout (Phase: Decision)
Endpoint: /api/cron/test
The Scout scans the database for active subscribers whose nextDepositDate matches the current business date.

Deterministic Logic: It pulls the masterSequenceJson for the specific State/Program to determine the exact deposit day.

The Audit: Every "SEND" decision is recorded in NotificationDecisionAudit.

The Frozen Payload: The email content is generated and "frozen" into the NotificationOutbox table. This ensures the message remains unchanged even if the system templates are updated later.

2. The Dispatcher (Phase: Transmission)
Endpoint: /api/cron/dispatch
The Dispatcher picks up PENDING rows from the Outbox and attempts delivery via Resend.

Idempotency: Uses a unique idempotencyKey to prevent duplicate emails at the provider level.

Atomic Claiming: Uses PostgreSQL SKIP LOCKED to allow multiple workers to run without colliding.

Exponential Backoff: If a transient error occurs, the system automatically schedules a retry with increasing delays.

🛠️ Operations & Maintenance
Adding a New State or Program
Create a new entry in the RuleIdentity table (e.g., CA, SNAP).

Create a corresponding ScheduleRuleSet with the masterSequenceJson defining the deposit calendar.

Ensure a matching template exists in the notification service.

Handling "Dead Letters"
If an email fails permanently (e.g., invalid email address), it is moved to a DEAD_LETTER status.

To Investigate: Check the lastError column in the NotificationOutbox table.

To Retry: Fix the underlying issue, change the status back to PENDING, and reset retryCount to 0.

Technical Stack
Database: PostgreSQL (Neon)

ORM: Prisma

Email Provider: Resend

Runtime: Vercel Edge Functions (Cron)

🚦 Testing Locally
To trigger a manual sweep of the engine:

Update a Subscription row's nextDepositDate to the current date.

Run the Scout: curl http://localhost:3000/api/cron/test

Run the Dispatcher: curl http://localhost:3000/api/cron/dispatch