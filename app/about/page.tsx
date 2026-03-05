import React from 'react';

export const metadata = {
  title: 'About Our Verification Protocol | WhenIsDue',
  description: 'How we verify government and agency payment dates with millisecond accuracy.',
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-300 leading-relaxed">
      <h1 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter italic">The Protocol</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest text-blue-400">01. Our Mission</h2>
        <p className="text-lg">
          WhenIsDue was engineered to solve the "Payment Gap"—the stressful period between an expected payment and its actual arrival. 
          We provide high-fidelity, verified schedules for SSI, SSDI, SNAP, and other critical disbursements.
        </p>
      </section>

      <section className="mb-12 border-l-2 border-zinc-800 pl-8">
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest text-blue-400">02. Verification Logic</h2>
        <p className="mb-4">
          Our data is not guessed. We use a dual-layer verification system:
        </p>
        <ul className="space-y-4 text-sm">
          <li><span className="text-white font-bold">Algorithmic Prediction:</span> Our "Ghost Month" engine calculates holiday shifts and weekend "Pay-Friday" rules.</li>
          <li><span className="text-white font-bold">Source-of-Truth Scraping:</span> We monitor official agency PDF schedules and treasury announcements 24/7.</li>
          <li><span className="text-white font-bold">Community Confirmation:</span> We integrate live feedback to confirm when payments actually "hit" user accounts.</li>
        </ul>
      </section>

      <section className="mb-12 bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">03. Why Trust Us?</h2>
        <p className="text-sm italic text-gray-400">
          In a world of "Thin Content" AI sites, WhenIsDue is a precision tool. We cite our sources on every series page 
          and provide millisecond-accurate push alerts so you never have to guess again.
        </p>
      </section>
    </main>
  );
}