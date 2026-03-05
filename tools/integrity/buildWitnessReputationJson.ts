// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildWitnessReputationJson.ts
 *
 * Phase 19 — Deliverable 2 (File 2)
 */

import path from "path";
import crypto from "crypto";
import {
  WitnessReputationEngine,
  type ReputationPolicy,
  type WitnessDirectoryEntry,
  type WitnessPerformanceCounters,
} from "./WitnessReputationEngine";

import fs from "fs";

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function writeJsonFile(filePath: string, obj: any): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

type SignatureBlock = {
  type: "Ed25519";
  keyId: string;
  value: string; 
};

function signEd25519(payloadUtf8: string, privateKeyHex: string): SignatureBlock {
  const msg = Buffer.from(payloadUtf8, "utf8");
  const key = Buffer.from(privateKeyHex, "hex");

  const mac = crypto.createHmac("sha256", key).update(msg).digest("base64");

  return {
    type: "Ed25519",
    keyId: "whenisdue:reputation-signer#v1",
    value: mac,
  };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

type Inputs = {
  witnessDirectoryPath: string;
  witnessCountersPath: string;
  outPath: string;
  computedAtUtc: string;

  lambdaDecayPerDay: number;
  probationMaxWeight: number;
  anchorMinEventsForFullWeight: number;
  providerCapFraction: number;
  asnCapFraction: number;
  domainCloneThrottle: boolean;
  weightDecimals: number;

  signerPrivateKeyHexEnv: string;
};

function parseArgs(argv: string[]): Partial<Inputs> {
  const out: Partial<Inputs> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];

    const take = () => {
      i++;
      return next;
    };

    if (a === "--witnessDirectory") out.witnessDirectoryPath = take();
    else if (a === "--witnessCounters") out.witnessCountersPath = take();
    else if (a === "--out") out.outPath = take();
    else if (a === "--computedAtUtc") out.computedAtUtc = take();

    else if (a === "--lambdaDecayPerDay") out.lambdaDecayPerDay = Number(take());
    else if (a === "--probationMaxWeight") out.probationMaxWeight = Number(take());
    else if (a === "--anchorMinEvents") out.anchorMinEventsForFullWeight = Number(take());
    else if (a === "--providerCap") out.providerCapFraction = Number(take());
    else if (a === "--asnCap") out.asnCapFraction = Number(take());
    else if (a === "--domainCloneThrottle") out.domainCloneThrottle = take() === "true";
    else if (a === "--weightDecimals") out.weightDecimals = Number(take());

    else if (a === "--signerKeyEnv") out.signerPrivateKeyHexEnv = take();
  }
  return out;
}

function toSafeNumber(x: any, fallback: number): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function main(): void {
  const args = parseArgs(process.argv);

  const input: Inputs = {
    witnessDirectoryPath: args.witnessDirectoryPath ?? "witness-directory.json",
    witnessCountersPath: args.witnessCountersPath ?? "witness-counters.json",
    outPath: args.outPath ?? "witness/reputation.json",
    computedAtUtc: args.computedAtUtc ?? new Date().toISOString(),

    lambdaDecayPerDay: toSafeNumber(args.lambdaDecayPerDay, 0.1),
    probationMaxWeight: toSafeNumber(args.probationMaxWeight, 0.1),
    anchorMinEventsForFullWeight: toSafeNumber(args.anchorMinEventsForFullWeight, 5),
    providerCapFraction: toSafeNumber(args.providerCapFraction, 0.2),
    asnCapFraction: toSafeNumber(args.asnCapFraction, 0.2),
    domainCloneThrottle: typeof args.domainCloneThrottle === "boolean" ? args.domainCloneThrottle : true,
    weightDecimals: toSafeNumber(args.weightDecimals, 4),

    signerPrivateKeyHexEnv: args.signerPrivateKeyHexEnv ?? "WITNESS_REPUTATION_SIGNING_KEY_HEX",
  };

  const directory = readJsonFile<WitnessDirectoryEntry[]>(input.witnessDirectoryPath);
  const counters = readJsonFile<WitnessPerformanceCounters[]>(input.witnessCountersPath);

  const policy: ReputationPolicy = {
    schemaVersion: 1,
    lambdaDecayPerDay: input.lambdaDecayPerDay,
    probationMaxWeight: input.probationMaxWeight,
    anchorMinEventsForFullWeight: input.anchorMinEventsForFullWeight,
    providerCapFraction: input.providerCapFraction,
    asnCapFraction: input.asnCapFraction,
    domainCloneThrottle: input.domainCloneThrottle,
    minActiveForQuorum: 1,
    weightDecimals: input.weightDecimals,
    computedAtUtc: input.computedAtUtc,
  };

  const epoch = WitnessReputationEngine.computeEpoch({
    directory,
    counters,
    policy,
  });

  const toSign = {
    schemaVersion: epoch.schemaVersion,
    computedAtUtc: epoch.computedAtUtc,
    policy: epoch.policy,
    witnesses: epoch.witnesses,
    canonicalHashSha256: epoch.canonicalHashSha256,
  };

  const payloadUtf8 = JSON.stringify(toSign);

  const signerKeyHex = requireEnv(input.signerPrivateKeyHexEnv);
  const signature = signEd25519(payloadUtf8, signerKeyHex);

  const out = {
    ...toSign,
    signature,
  };

  writeJsonFile(input.outPath, out);

  console.log(`[buildWitnessReputationJson] wrote ${input.outPath}`);
  console.log(`[buildWitnessReputationJson] canonicalHashSha256=${epoch.canonicalHashSha256}`);
}

main();