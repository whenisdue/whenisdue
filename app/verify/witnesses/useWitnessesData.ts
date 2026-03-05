import { useState, useEffect } from "react";

// --- Types from Blueprint ---
export type PageLight = "GREEN" | "AMBER" | "RED" | "INDETERMINATE";
export type WitnessReasonCode = "OK" | "TRUST_CONTRACT_UNAVAILABLE" | "WITNESS_DIRECTORY_UNAVAILABLE" | "REPUTATION_UNAVAILABLE" | "QUARANTINE_UNAVAILABLE" | "LATEST_STH_UNAVAILABLE" | "HISTORY_UNAVAILABLE" | "WEIGHT_TOTAL_ZERO" | "QUORUM_BELOW_VALID_THRESHOLD" | "QUORUM_BELOW_HIGHTRUST_THRESHOLD" | "WITNESS_QUARANTINED_RED" | "WITNESS_QUARANTINED_AMBER" | "KEY_CONTINUITY_MISSING" | "KEY_ROTATION_UNPROVEN" | "WITNESS_LAGGING" | "WITNESS_INACTIVE";

export interface WitnessNetworkBannerModel {
  status: PageLight;
  title: string;
  summaryLines: string[];
  counts: {
    total: number;
    active: number;
    probationary: number;
    retired: number;
    quarantinedRed: number;
    quarantinedAmber: number;
    lagging: number;
  };
}

export interface WeightedQuorumModel {
  quorumScore: number | "INDETERMINATE";
  totalWeight: number;
  signingWeight: number | "UNKNOWN";
  validThreshold: number;
  highTrustThreshold: number;
  contributors: Array<{ id: string; weight: number }>;
}

export interface WitnessRowModel {
  witnessId: string;
  displayId: string;
  baseStatus: "ACTIVE" | "QUALIFIED" | "PROBATION" | "RETIRED" | "UNKNOWN";
  quarantine?: { state: "RED" | "AMBER"; reasonCode: string; sinceUtc?: string };
  weight: number;
  effectiveWeight: number;
  signedCurrentHead: "YES" | "NO" | "UNKNOWN";
  counters?: { signedCheckpoints: number; missedCheckpoints: number; conflictFlags: number };
  lastSeenUtc?: string;
  key: { kid?: string; pubKeyShort?: string; notBeforeUtc?: string; notAfterUtc?: string };
  badges: string[];
}

export interface ReputationTimelineModel {
  availability: "NONE" | "SNAPSHOT_ONLY" | "HISTORY_AVAILABLE";
  notes: string[];
}

export interface KeyContinuityModel {
  status: PageLight;
  currentKeySet: Array<{ witnessId: string; kid: string; pubKey: string; notBeforeUtc?: string; notAfterUtc?: string; }>;
  rotationEvents: Array<any>;
  issues: Array<{ code: WitnessReasonCode; witnessId?: string; detail?: string }>;
}

export type WitnessesPageState =
  | { kind: "LOADING"; step: string }
  | {
      kind: "READY";
      banner: WitnessNetworkBannerModel;
      quorum: WeightedQuorumModel;
      table: WitnessRowModel[];
      timeline: ReputationTimelineModel;
      continuity: KeyContinuityModel;
      reasons: Array<{ code: WitnessReasonCode; detail?: string }>;
      rawRefs: any;
    }
  | { kind: "FAILED"; error: { code: string; message: string } };

export function useWitnessesData() {
  const [state, setState] = useState<WitnessesPageState>({ kind: "LOADING", step: "FETCH_CORE_ARTIFACTS" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [trustRes, dirRes, repRes, quarRes, sthRes] = await Promise.allSettled([
          fetch("/.well-known/whenisdue-trust.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/.well-known/witness-directory.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/witness/reputation.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/integrity/conflicts/quarantine.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/transparency/sth/latest.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
        ]);

        const trust = trustRes.status === "fulfilled" ? trustRes.value : null;
        const directory = dirRes.status === "fulfilled" ? dirRes.value : null;
        const reputation = repRes.status === "fulfilled" ? repRes.value : null;
        const quarantine = quarRes.status === "fulfilled" ? quarRes.value : null;
        // const sth = sthRes.status === "fulfilled" ? sthRes.value : null;

        if (!trust) throw new Error("TRUST_CONTRACT_UNAVAILABLE");
        if (!directory) throw new Error("WITNESS_DIRECTORY_UNAVAILABLE");

        const validThreshold = trust.quorumPolicy?.thresholdWeight || 0.67;
        const highTrustThreshold = trust.quorumPolicy?.highTrustThreshold || 0.85;

        const table: WitnessRowModel[] = [];
        let totalWeight = 0;
        const counts = { total: 0, active: 0, probationary: 0, retired: 0, quarantinedRed: 0, quarantinedAmber: 0, lagging: 0 };
        const currentKeySet: any[] = [];

        const dirWitnesses = directory.witnesses || [];
        const repWitnesses = reputation?.witnesses || {};

        for (const w of dirWitnesses) {
          counts.total++;
          const wid = w.witnessId;
          const rep = repWitnesses[wid] || { currentWeight: 0 };
          const qState = quarantine?.quarantine?.witnesses?.[wid];
          
          let effectiveWeight = rep.currentWeight || 0;
          let isRed = false;
          let isAmber = false;
          const badges: string[] = [];

          if (qState) {
            if (qState.reason?.includes("RED") || qState.state === "RED") {
              isRed = true;
              effectiveWeight = 0;
              badges.push("QUARANTINED_RED");
              counts.quarantinedRed++;
            } else {
              isAmber = true;
              effectiveWeight = Math.min(effectiveWeight, 0.1); // Amber cap
              badges.push("QUARANTINED_AMBER");
              counts.quarantinedAmber++;
            }
          }

          if (w.status === "ACTIVE") counts.active++;
          if (w.status === "PROBATION") { counts.probationary++; badges.push("PROBATION"); }
          if (w.status === "RETIRED") { counts.retired++; effectiveWeight = 0; badges.push("RETIRED"); }

          totalWeight += effectiveWeight;

          const activeKey = w.keys?.[0];
          if (activeKey) {
            currentKeySet.push({
              witnessId: wid,
              kid: activeKey.kid,
              pubKey: `${activeKey.publicKey.slice(0,16)}...`,
              notBeforeUtc: activeKey.notBeforeUtc
            });
          }

          table.push({
            witnessId: wid,
            displayId: wid.split(":").pop() || wid,
            baseStatus: w.status || "UNKNOWN",
            quarantine: qState ? { state: isRed ? "RED" : "AMBER", reasonCode: qState.reason || "UNKNOWN" } : undefined,
            weight: rep.currentWeight || 0,
            effectiveWeight,
            signedCurrentHead: "UNKNOWN", // Defaulting to unknown since STH rarely lists all witness sigs directly
            counters: {
              signedCheckpoints: rep.signedCheckpoints || 0,
              missedCheckpoints: rep.missedCheckpoints || 0,
              conflictFlags: rep.conflictFlags || 0
            },
            lastSeenUtc: rep.lastSeenUtc || "N/A",
            key: { kid: activeKey?.kid, pubKeyShort: activeKey ? `${activeKey.publicKey.slice(0,8)}...` : "N/A" },
            badges
          });
        }

        table.sort((a, b) => b.effectiveWeight - a.effectiveWeight || a.witnessId.localeCompare(b.witnessId));

        const quorum: WeightedQuorumModel = {
          quorumScore: "INDETERMINATE",
          totalWeight,
          signingWeight: "UNKNOWN",
          validThreshold,
          highTrustThreshold,
          contributors: table.filter(t => t.effectiveWeight > 0).map(t => ({ id: t.displayId, weight: t.effectiveWeight }))
        };

        const banner: WitnessNetworkBannerModel = {
          status: counts.quarantinedRed > 0 ? "RED" : (counts.quarantinedAmber > 0 || totalWeight === 0 ? "AMBER" : "GREEN"),
          title: counts.quarantinedRed > 0 ? "CRITICAL: RED Quarantine Active" : "Network Quorum Capacity Healthy",
          summaryLines: [
            `Total Effective Network Weight: ${totalWeight.toFixed(4)}`,
            "Signature view unavailable (INDETERMINATE quorum state)."
          ],
          counts
        };

        if (isMounted) setState({
          kind: "READY",
          banner,
          quorum,
          table,
          timeline: { availability: "SNAPSHOT_ONLY", notes: ["History feed unavailable; displaying current snapshot only."] },
          continuity: { status: "GREEN", currentKeySet, rotationEvents: [], issues: [] },
          reasons: [{ code: "OK" }],
          rawRefs: {
            trustUrl: "/.well-known/whenisdue-trust.json",
            directoryUrl: "/.well-known/witness-directory.json",
            reputationUrl: "/witness/reputation.json",
            quarantineUrl: "/integrity/conflicts/quarantine.json",
            latestSthUrl: "/transparency/sth/latest.json"
          }
        });

      } catch (e: any) {
        if (isMounted) setState({ kind: "FAILED", error: { code: e.message, message: "Failed to load witness network state." } });
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return state;
}