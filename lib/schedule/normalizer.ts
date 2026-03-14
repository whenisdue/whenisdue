import { format } from "date-fns";

export type ScheduleRowViewModel = {
  rowKey: string;
  identifierLabel: string;
  paymentLabel: string;
};

/**
 * RESEARCH APPLIED: Topic 42 - dual-purpose canonical dataset.
 * This simplifies the raw database events into a flat model for the UI.
 */
export function buildScheduleRows(events: any[]): ScheduleRowViewModel[] {
  return events.map((event) => ({
    rowKey: event.id,
    identifierLabel: event.identifierMatch, // Already formatted as "00 - 04" in DB
    paymentLabel: format(new Date(event.depositDate), "MMMM d, yyyy")
  }));
}