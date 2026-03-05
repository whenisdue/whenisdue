import React from 'react';

interface GhostMonthBannerProps {
  scheduledMonth: string; // e.g., "January"
  actualPayDate: Date;    // e.g., 2025-12-31
}

export default function GhostMonthBanner({ scheduledMonth, actualPayDate }: GhostMonthBannerProps) {
  // Extract the month the payment actually occurs in
  const actualMonth = actualPayDate.toLocaleString('default', { month: 'long' });

  // If the scheduled month and actual month match, no ghost month occurred! Hide the banner.
  if (scheduledMonth === actualMonth) {
    return null; 
  }

  return (
    <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-2xl mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4">
        <div className="text-red-500 mt-1">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-red-400 font-black uppercase tracking-widest text-sm mb-1">
            Missing {scheduledMonth} Payment? Don't Panic.
          </h3>
          <p className="text-red-200/80 text-sm leading-relaxed">
            Did your benefits stop? No. Because the 1st of {scheduledMonth} is a holiday or weekend, 
            the government already issued this payment early on <strong className="text-white">{actualMonth} {actualPayDate.getDate()}</strong>. 
            This is not a bonus check, it is your standard {scheduledMonth} payment.
          </p>
        </div>
      </div>
    </div>
  );
}