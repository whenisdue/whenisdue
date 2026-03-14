"use client";

import { useState, useEffect, useCallback } from "react";
import { addDays, isAfter, parseISO } from "date-fns";

const STORAGE_KEY = "wd_last_success";
const SCHEMA_VERSION = 1;
const EXPIRY_DAYS = 35;

export interface SavedLookup {
  version: number;
  stateCode: string;
  stateName: string;
  programCode: string;
  identifierKind: string;
  identifierValue: string;
  displayLabel: string;
  savedAt: string;
  expiresAt: string;
}

export function useSearchPersistence() {
  const [savedLookup, setSavedLookup] = useState<SavedLookup | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed: SavedLookup = JSON.parse(raw);
      const isValid = 
        parsed.version === SCHEMA_VERSION &&
        parsed.stateCode &&
        parsed.programCode &&
        parsed.identifierKind &&
        parsed.identifierValue &&
        isAfter(parseISO(parsed.expiresAt), new Date());

      if (isValid) {
        setSavedLookup(parsed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveLookup = useCallback((data: {
    stateCode: string;
    stateName: string;
    programCode: string;
    identifierKind: string;
    identifierValue: string;
    identifierLabel: string;
  }) => {
    try {
      const now = new Date();
      const expiry = addDays(now, EXPIRY_DAYS);

      const payload: SavedLookup = {
        version: SCHEMA_VERSION,
        stateCode: data.stateCode,
        stateName: data.stateName,
        programCode: data.programCode,
        identifierKind: data.identifierKind,
        identifierValue: data.identifierValue,
        displayLabel: `${data.stateName} ${data.programCode} (${data.identifierLabel} ${data.identifierValue})`,
        savedAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedLookup(payload);
    } catch (e) {
      console.warn("Failed to save lookup persistence", e);
    }
  }, []);

  const dismissLookup = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedLookup(null);
    } catch (e) {}
  }, []);

  return { savedLookup, saveLookup, dismissLookup };
}