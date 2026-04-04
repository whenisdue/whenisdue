"use client";

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  Camera, 
  Zap, 
  Globe, 
  TrendingDown, 
  Users 
} from 'lucide-react';

interface MetricCardProps {
  node: string;
  title: string;
  value: string;
  icon: React.ReactNode;
}

interface SovereignDashboardProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * @description Master variants with explicit typing to resolve Easing literal mismatch.
 */
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      staggerChildren: 0.15, 
      duration: 0.5, 
      ease: "easeOut" 
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function SovereignDashboardClient({ user }: SovereignDashboardProps) {
  const [appState, setAppState] = useState({
    isScanning: false,
    nationalPressure: 68.4,
    dataFreshness: "99.9%"
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* 1. STATUS BAR: STICKY AUTHORITY LAYER */}
      <div className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          <h1 className="text-lg font-bold tracking-tighter uppercase">Singapore Core: C090</h1>
        </div>
        <div className="flex gap-6 text-[10px] font-mono text-slate-400">
          <span className="hidden md:inline font-bold">OPERATOR: {user.name?.toUpperCase() || "UNIDENTIFIED"}</span>
          <span className="text-cyan-500">D100_FRESHNESS: {appState.dataFreshness}</span>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* 2. NATIONAL CRISIS HEATMAP (E200) - PROMOTED TO MOTION.SECTION */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MapIcon size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">Node E200</h2>
                <h3 className="text-2xl font-bold italic">National Crisis Heatmap</h3>
              </div>
              <div className="text-right">
                <span className="block text-4xl font-black text-red-500">{appState.nationalPressure}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tight font-bold">Mid-Month Depletion Pressure</span>
              </div>
            </div>
            
            <div className="h-48 w-full bg-slate-800/50 rounded-lg flex items-end gap-1 p-2 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 100}%` }}
                  transition={{ delay: i * 0.02, duration: 1 }}
                  className={`flex-1 rounded-t-sm ${i > 15 && i < 25 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* 3. PHISHING CLONE SIGNATURE SYSTEM (E188) - PROMOTED TO MOTION.SECTION */}
        <motion.section 
          variants={itemVariants}
          className="md:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="text-emerald-400" size={18} />
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">Security E188</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Real-time TLS Handshake monitoring active. ASN reputation mapping protecting all state portal links from 1099-skimming clones.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold tracking-tighter">PORTAL_VERIFIED</span>
            <span className="text-slate-500">REF: D100-PSS</span>
          </div>
        </motion.section>

        {/* 4. SURVIVAL METRICS GRID (E191, E195, E197, E193) */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <MetricCard node="E191" title="Cliff Severity" value="High" icon={<TrendingDown className="text-orange-400" />} />
          <MetricCard node="E195" title="Coastal Burn Rate" value="2.4x" icon={<Zap className="text-yellow-400" />} />
          <MetricCard node="E197" title="Gig-Income Buffer" value="$420.00" icon={<Users className="text-blue-400" />} />
          <MetricCard node="E193" title="Remittance Recall" value="Low" icon={<Globe className="text-purple-400" />} />
        </motion.div>

        {/* 5. CAMERA-TO-ORACLE INTERFACE (E182) */}
        <motion.section variants={itemVariants} className="md:col-span-12 mt-4">
          <button 
            onClick={() => setAppState(s => ({ ...s, isScanning: !s.isScanning }))}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-lg shadow-cyan-900/20 group"
          >
            <Camera size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="tracking-widest uppercase">Initiate Optical Privacy Scan</span>
          </button>
        </motion.section>
      </motion.div>
    </main>
  );
}

/**
 * @description Individual metric card using the sub-variant for staggered entrance.
 */
function MetricCard({ node, title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{node}</span>
        {icon}
      </div>
      <h4 className="text-sm text-slate-400 font-bold tracking-tight">{title}</h4>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}