import { groupOfficialDates, OfficialDate } from "../lib/schedule";

interface ScheduleTableProps {
  dates: OfficialDate[];
}

export default function ScheduleTable({ dates }: ScheduleTableProps) {
  const groupedDates = groupOfficialDates(dates);

  if (groupedDates.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
        Official schedule has not been published yet.
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-12 border-t border-slate-200 pt-8">
      <h3 className="text-2xl font-bold text-slate-900 border-b pb-2">Complete Payment Calendar</h3>
      
      <div className="grid gap-8 md:grid-cols-2">
        {groupedDates.map((group) => (
          <div key={group.month} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{group.month} Payment Schedule</caption>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-800">{group.month}</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-slate-800 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.items.map((item, idx) => {
                  const dateObj = new Date(item.date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC'
                  });

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-700">{item.group}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 inline-block text-center whitespace-nowrap">
                          {formattedDate}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}