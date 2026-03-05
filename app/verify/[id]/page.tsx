import React from 'react';

export default function VerificationConsole({ params }: { params: { id: string } }) {
  const mockProof = {
    id: params.id,
    status: "CONFIRMED",
    verifiedAt: "2026-03-03T00:00:00Z",
    trustScore: 99,
    witness: "KMS_LOG_V1",
    signature: "sha256:7f83b1234567890abcdef1234567890abcdef1234567890abcdef12345"
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-3xl mx-auto border border-gray-800 rounded-lg p-6 bg-gray-900 shadow-2xl">
        <header className="border-b border-gray-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-green-400">/ TRUST_VERIFICATION_CONSOLE</h1>
        </header>
        <section className="space-y-6">
          <div>
            <h2 className="text-gray-400 text-sm mb-1">Target Record ID:</h2>
            <p className="text-lg text-white">{mockProof.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black border border-gray-800 rounded text-center">
              <h3 className="text-gray-500 text-xs mb-1">TRUST_SCORE</h3>
              <p className="text-2xl font-bold text-white">{mockProof.trustScore}%</p>
            </div>
            <div className="p-4 bg-black border border-gray-800 rounded text-center">
              <h3 className="text-gray-500 text-xs mb-1">VERDICT</h3>
              <p className="text-2xl font-bold text-green-400">{mockProof.status}</p>
            </div>
          </div>
          <div>
            <h2 className="text-gray-400 text-sm mb-1">Cryptographic Witness:</h2>
            <p className="text-xs text-gray-300 break-all bg-black p-3 rounded border border-gray-800">
              {mockProof.signature}
            </p>
          </div>
        </section>
      </div>
      <div className="mt-8 text-center">
        <a href="/series/ssa-ssdi-payments" className="text-blue-400 hover:text-blue-300 text-sm underline">
          ← Return to Series Page
        </a>
      </div>
    </main>
  );
}