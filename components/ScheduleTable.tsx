import { Info } from "lucide-react";

// Define the shape of our JSON data
type ScheduleData = {
  headers: string[];
  rows: { identifier: string; date: string }[];
  footerNote?: string;
};

export default function ScheduleTable({ data }: { data: ScheduleData | null | undefined }) {
  if (!data || !data.headers || !data.rows) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Official Deposit Schedule</h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[300px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {data.headers.map((header, i) => (
                  <th key={i} scope="col" className="p-4 text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors group">
                  <td className="p-4 text-base font-semibold text-slate-700 group-hover:text-blue-900">
                    {row.identifier}
                  </td>
                  <td className="p-4 text-base font-bold text-slate-900 group-hover:text-blue-900">
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.footerNote && (
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {data.footerNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}