import React from 'react';

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-400 text-sm leading-7">
      <h1 className="text-3xl font-black text-white mb-10 uppercase italic">Terms of Service</h1>
      
      <h2 className="text-white font-bold mt-8 mb-2">1. Information Only (YMYL Disclaimer)</h2>
      <p className="mb-6">
        The data provided by WhenIsDue is for informational purposes only. We are not a government agency, 
        financial institution, or legal advisor. Always verify critical payment dates with your bank or the 
        issuing agency directly.
      </p>

      <h2 className="text-white font-bold mt-8 mb-2">2. Accuracy of Data</h2>
      <p className="mb-6">
        While we use advanced verification protocols, we cannot guarantee 100% accuracy. Payment dates can change 
        due to bank-specific processing times, unexpected federal holidays, or agency errors.
      </p>

      <h2 className="text-white font-bold mt-8 mb-2">3. Push Notifications</h2>
      <p className="mb-6">
        By subscribing to our alerts, you agree to receive automated notifications. We are not responsible for 
        delayed or missed notifications due to network connectivity or browser settings.
      </p>

      <div className="mt-12 p-4 border border-red-900/50 bg-red-900/10 rounded-lg">
        <p className="text-red-400 font-mono text-[10px] uppercase tracking-tighter">
          LIMITATION OF LIABILITY: WE ARE NOT LIABLE FOR ANY FINANCIAL LOSS OR LATE FEES INCURRED DUE TO 
          RELIANCE ON OUR DATA. USE AT YOUR OWN DISCRETION.
        </p>
      </div>
    </main>
  );
}