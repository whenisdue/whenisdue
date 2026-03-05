export interface OfficialDate {
  month?: string;
  date: string;
  group?: string;
}

export interface GroupedSchedule {
  month: string;
  items: OfficialDate[];
}

export function groupOfficialDates(dates: OfficialDate[]): GroupedSchedule[] {
  if (!dates || dates.length === 0) return [];

  const grouped = dates.reduce((acc, curr) => {
    // Fallback to parsing the month from the ISO string if the month field is missing
    const monthName = curr.month || new Date(curr.date).toLocaleString('default', { month: 'long', timeZone: 'UTC' });
    
    if (!acc[monthName]) {
      acc[monthName] = [];
    }
    acc[monthName].push({
      ...curr,
      group: curr.group || "Other"
    });
    return acc;
  }, {} as Record<string, OfficialDate[]>);

  // Convert the object map back into an ordered array
  return Object.keys(grouped).map(month => ({
    month,
    items: grouped[month].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }));
}