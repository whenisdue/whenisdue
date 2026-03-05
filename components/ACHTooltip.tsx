import React from 'react';

interface ACHTooltipProps {
  officialDate: Date;
  isSNAP: boolean;
}

export default function ACHTooltip({ officialDate, isSNAP }: ACHTooltipProps) {
  if (isSNAP) {
    return (
      <div className="bg-gray-900/50 p-4 rounded-xl mt-4 text-xs border border-gray-800 text-gray-400">
        <strong className="text-gray-300">Deposit Timing:</strong> SNAP benefits load directly to state EBT systems (often overnight or 12:00 AM local time). Fintech early-deposit features cannot advance EBT funds.
      </div>
    );
  }

  const dayOfWeek = officialDate.getDay(); 
  let earlyDayStr = '';
  let earlyDateObj = new Date(officialDate);
  
  // Treasury 4-3-2 logic & calculating the actual early date
  if (dayOfWeek === 3) {
    earlyDayStr = 'the previous Friday'; 
    earlyDateObj.setDate(officialDate.getDate() - 5);
  } else if (dayOfWeek === 5) {
    earlyDayStr = 'Tuesday'; 
    earlyDateObj.setDate(officialDate.getDate() - 3);
  } else if (dayOfWeek === 1) {
    earlyDayStr = 'the previous Thursday'; 
    earlyDateObj.setDate(officialDate.getDate() - 4);
  } else {
    earlyDayStr = 'up to 2 days early';
    earlyDateObj.setDate(officialDate.getDate() - 2);
  }

  const formattedEarlyDate = earlyDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="bg-blue-900/10 p-5 rounded-xl mt-6 text-sm border border-blue-900/30">
      <h4 className="font-black text-blue-500 mb-4 uppercase tracking-widest text-[10px]">
        ACH Settlement & Early Deposit
      </h4>
      <ul className="text-gray-300 space-y-4 mb-6">
        <li className="flex gap-2">
          <span className="text-gray-500">🏦</span>
          <span className="text-gray-400">
            <strong>Standard Banks:</strong> Official Federal Reserve ACH settlement occurs at 8:30 AM ET on the payment date. If funds are not visible at midnight, wait until 10:00 AM ET.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-gray-500">💳</span>
          <span className="text-gray-400">
            <strong>Direct Express:</strong> Does NOT pay early. Funds typically post at 12:01 AM ET on the official date.
          </span>
        </li>
      </ul>

      {/* THE MONETIZATION LAYER */}
      <div className="bg-gray-900 border border-blue-500/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">
            Want this deposit earlier?
          </div>
          <div className="text-sm font-medium">
            With Chime, you could receive it on <strong className="text-white bg-blue-600/20 px-1 rounded">{formattedEarlyDate}</strong>.
          </div>
        </div>
        <a 
          href="https://partner.chime.com/c/123456/98765/1234?subId=ach_tooltip" 
          target="_blank" 
          rel="noopener noreferrer"
          className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
        >
          Get Early Deposit →
        </a>
      </div>
    </div>
  );
}