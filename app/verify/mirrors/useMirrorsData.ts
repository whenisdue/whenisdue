import { useState, useEffect } from "react";

// --- Types ---
export type PageLight = "NEUTRAL" | "GREEN" | "AMBER" | "RED";
export type MirrorStatus = "GREEN" | "AMBER" | "RED" | "UNREACHABLE";

export interface FederationBannerModel {
  light: PageLight;
  totalMirrors: number;
  reachableMirrors: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
  quarantinedCount: number;
  majorityRootHash: string | null;
  message: string;
}

export interface MirrorRowModel {
  mirrorId: string;
  baseUrl: string;
  region: string;
  status: MirrorStatus;
  treeSize: number | null;
  rootHash: string | null;
  treeLag: number | null;
  isQuarantined: boolean;
  reasonCode: string;
}

export interface ConvergenceModel {
  canonicalRootHash?: string;
  majorityRootHash?: string;
  rootHashBuckets: Array<{ rootHash: string; count: number; mirrorIds: string[] }>;
  outlierMirrors: string[];
  notes: string[];
}

export interface MirrorMapModel {
  clusters: Array<{
    clusterId: string;
    label: string;
    nodes: MirrorRowModel[];
  }>;
  legend: Array<{ status: MirrorStatus; label: string }>;
}

export type MirrorsPageState =
  | { kind: "LOADING"; step: string }
  | {
      kind: "READY";
      banner: FederationBannerModel;
      map: MirrorMapModel;
      table: MirrorRowModel[];
      convergence: ConvergenceModel;
      quarantinePanel: { quarantinedMirrors: any[] };
      rawRefs: any;
    }
  | { kind: "FAILED"; error: { code: string; message: string } };

// --- Constants ---
const MAX_TREE_LAG_AMBER = 256;

// --- Hook ---
export function useMirrorsData() {
  const [state, setState] = useState<MirrorsPageState>({ kind: "LOADING", step: "FETCH_DIRECTORY" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setState({ kind: "LOADING", step: "FETCH_CORE_ARTIFACTS" });

        // Fetch Core Files
        const [dirRes, sthRes, quarRes] = await Promise.allSettled([
          fetch("/.well-known/mirror-directory.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/transparency/sth/latest.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
          fetch("/integrity/conflicts/quarantine.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
        ]);

        const directory = dirRes.status === "fulfilled" ? dirRes.value : null;
        const primarySth = sthRes.status === "fulfilled" ? sthRes.value : null;
        const quarantine = quarRes.status === "fulfilled" ? quarRes.value : null;

        if (!directory || !directory.mirrors) {
          throw new Error("MIRROR_DIRECTORY_UNAVAILABLE");
        }

        setState({ kind: "LOADING", step: "PINGING_MIRRORS" });

        // Ping all mirrors in parallel
        const mirrorPromises = directory.mirrors.map(async (m: any) => {
          try {
            // In a real production app, baseUrl is a full URL (https://mirror.example.com).
            // For this UI, we fetch their latest.json endpoint.
            const url = m.baseUrl.endsWith("/") ? `${m.baseUrl}transparency/sth/latest.json` : `${m.baseUrl}/transparency/sth/latest.json`;
            const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error("HTTP_ERR");
            const data = await res.json();
            return { mirror: m, sth: data, reachable: true };
          } catch (e) {
            return { mirror: m, sth: null, reachable: false };
          }
        });

        const mirrorResults = await Promise.all(mirrorPromises);

        // Compute Logic
        const table: MirrorRowModel[] = [];
        const buckets = new Map<string, string[]>();
        let quarantinedCount = 0;

        for (const res of mirrorResults) {
          const { mirror, sth, reachable } = res;
          const isQuarantined = !!quarantine?.quarantine?.mirrors?.[mirror.mirrorId];
          const qState = quarantine?.quarantine?.mirrors?.[mirror.mirrorId]?.reason?.includes("RED") ? "RED" : "AMBER";
          
          let status: MirrorStatus = "GREEN";
          let reasonCode = "OK";
          let treeLag: number | null = null;

          if (isQuarantined) {
            status = qState as MirrorStatus;
            reasonCode = `MIRROR_QUARANTINED_${qState}`;
            quarantinedCount++;
          } else if (!reachable || !sth) {
            status = "UNREACHABLE";
            reasonCode = "MIRROR_STH_UNREACHABLE";
          } else {
            // Lag Analysis
            if (primarySth?.treeSize !== undefined && sth.treeSize !== undefined) {
              treeLag = primarySth.treeSize - sth.treeSize;
              if (treeLag < 0) treeLag = 0; // Mirror is somehow ahead (shouldn't happen, but clamp it)
            }

            if (primarySth?.rootHash && sth.rootHash && primarySth.rootHash !== sth.rootHash && treeLag === 0) {
              status = "RED";
              reasonCode = "MIRROR_ROOT_MISMATCH";
            } else if (treeLag !== null && treeLag > MAX_TREE_LAG_AMBER) {
              status = "AMBER";
              reasonCode = "MIRROR_BEHIND_TREE_SIZE";
            }
          }

          if (reachable && sth?.rootHash) {
            const hash = sth.rootHash;
            if (!buckets.has(hash)) buckets.set(hash, []);
            buckets.get(hash)!.push(mirror.mirrorId);
          }

          table.push({
            mirrorId: mirror.mirrorId,
            baseUrl: mirror.baseUrl,
            region: mirror.region || "UNKNOWN",
            status,
            treeSize: sth?.treeSize ?? null,
            rootHash: sth?.rootHash ?? null,
            treeLag,
            isQuarantined,
            reasonCode
          });
        }

        // Sort table
        table.sort((a, b) => a.mirrorId.localeCompare(b.mirrorId));

        // Compute Convergence
        const sortedBuckets = Array.from(buckets.entries())
          .map(([hash, ids]) => ({ rootHash: hash, count: ids.length, mirrorIds: ids.sort() }))
          .sort((a, b) => b.count - a.count || a.rootHash.localeCompare(b.rootHash));

        const majorityRootHash = sortedBuckets.length > 0 ? sortedBuckets[0].rootHash : null;
        const outlierMirrors = sortedBuckets.slice(1).flatMap(b => b.mirrorIds);

        const convergence: ConvergenceModel = {
          canonicalRootHash: primarySth?.rootHash,
          majorityRootHash: majorityRootHash || undefined,
          rootHashBuckets: sortedBuckets,
          outlierMirrors,
          notes: []
        };

        if (primarySth?.rootHash && majorityRootHash && primarySth.rootHash !== majorityRootHash) {
          convergence.notes.push("Mirror majority root differs from primary latest root.");
        }

        // Compute Banner
        const greenCount = table.filter(t => t.status === "GREEN").length;
        const amberCount = table.filter(t => t.status === "AMBER").length;
        const redCount = table.filter(t => t.status === "RED").length;
        const unreachableCount = table.filter(t => t.status === "UNREACHABLE").length;

        let bannerLight: PageLight = "GREEN";
        if (redCount > 0) bannerLight = "RED";
        else if (amberCount > 0 || unreachableCount > 0) bannerLight = "AMBER";

        const banner: FederationBannerModel = {
          light: bannerLight,
          totalMirrors: table.length,
          reachableMirrors: table.length - unreachableCount,
          greenCount,
          amberCount,
          redCount,
          quarantinedCount,
          majorityRootHash,
          message: bannerLight === "RED" ? "CRITICAL: Network divergence or RED quarantine detected." : bannerLight === "AMBER" ? "WARNING: Network lag or unreachable nodes detected." : "Network is converged and healthy."
        };

        // Compute Map Clusters
        const clustersMap = new Map<string, MirrorRowModel[]>();
        for (const row of table) {
          if (!clustersMap.has(row.region)) clustersMap.set(row.region, []);
          clustersMap.get(row.region)!.push(row);
        }

        const clusters = Array.from(clustersMap.entries()).map(([region, nodes]) => ({
          clusterId: region,
          label: `Region: ${region}`,
          nodes: nodes.sort((a, b) => a.mirrorId.localeCompare(b.mirrorId))
        })).sort((a, b) => a.clusterId.localeCompare(b.clusterId));

        const mapModel: MirrorMapModel = {
          clusters,
          legend: [
            { status: "GREEN", label: "Converged" },
            { status: "AMBER", label: "Lagging / Warn" },
            { status: "RED", label: "Diverged / Quarantine" },
            { status: "UNREACHABLE", label: "Offline" }
          ]
        };

        if (isMounted) setState({
          kind: "READY", banner, map: mapModel, table, convergence,
          quarantinePanel: { quarantinedMirrors: table.filter(t => t.isQuarantined) },
          rawRefs: {
            manifestUrl: "/.well-known/whenisdue-manifest.json",
            mirrorDirectoryUrl: "/.well-known/mirror-directory.json",
            primarySthUrl: "/transparency/sth/latest.json",
            quarantineUrl: "/integrity/conflicts/quarantine.json",
            syncManifestUrl: "/transparency/sync-manifest.json"
          }
        });

      } catch (e: any) {
        if (isMounted) setState({ kind: "FAILED", error: { code: e.message, message: "Failed to build mirror topography." } });
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return state;
}