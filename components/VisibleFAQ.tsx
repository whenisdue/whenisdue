import { HelpCircle, ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

export default function VisibleFAQ({ faqs }: { faqs: FaqItem[] | null | undefined }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
      </div>
      
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details 
            key={i} 
            className="group bg-white border border-slate-200 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm"
          >
            <summary className="flex items-center justify-between p-5 text-lg font-bold text-slate-900 cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span className="pr-4">{faq.question}</span>
              <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-300 group-open:rotate-180 shrink-0" />
            </summary>
            
            <div className="p-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 mt-2 bg-slate-50">
              <p className="pt-4 text-base font-medium">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}