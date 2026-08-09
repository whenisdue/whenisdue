import {
  type HolidayCalendarId,
} from './holidayCalendars.ts'

export type HolidayCalendarVersion =
  | 'none-v1'
  | 'us-federal-v1'
  | 'uk-england-wales-v1'
  | 'ca-federal-v1'
  | 'au-nationwide-v1'
  | 'ph-predictable-regular-v1'

const versions: Record<
  HolidayCalendarId,
  HolidayCalendarVersion
> = {
  none: 'none-v1',
  us: 'us-federal-v1',
  uk: 'uk-england-wales-v1',
  ca: 'ca-federal-v1',
  au: 'au-nationwide-v1',
  ph: 'ph-predictable-regular-v1',
}

export function getHolidayCalendarVersion(
  id: HolidayCalendarId,
): HolidayCalendarVersion {
  return versions[id]
}
