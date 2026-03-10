import { DateTime, IANAZone } from "luxon";

export function parseLocalDateTimeToUtcDate(
  localDate: string,
  localTime: string,
  timeZone: string,
): Date {
  if (!IANAZone.isValidZone(timeZone)) {
    throw new Error(`Invalid IANA timezone: "${timeZone}"`);
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!dateMatch) throw new Error("Invalid localDate. Expected format: YYYY-MM-DD");

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(localTime);
  if (!timeMatch) throw new Error("Invalid localTime. Expected format: HH:mm");

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const dt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0, millisecond: 0 },
    { zone: timeZone }
  );

  if (!dt.isValid) {
    throw new Error(`Invalid datetime: ${dt.invalidExplanation}`);
  }

  // Detect nonexistent local times (DST spring-forward gap)
  const sameWallClock =
    dt.year === year &&
    dt.month === month &&
    dt.day === day &&
    dt.hour === hour &&
    dt.minute === minute;

  if (!sameWallClock) {
    throw new Error(`Nonexistent local time: "${localDate} ${localTime}" (DST gap).`);
  }

  // Detect ambiguous local times (DST fall-back overlap)
  const possible = dt.getPossibleOffsets();
  if (possible.length > 1) {
    throw new Error("Ambiguous local time due to DST overlap. Please adjust the time by 1 hour.");
  }

  return dt.toUTC().toJSDate();
}