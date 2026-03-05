import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DraftStatus = "ACTIVE" | "ARCHIVED" | "CANCELLED";

export interface DraftRecord {
  draftId: string;
  targetId: string; // Used for both conflictId and keyId
  actionType: string;
  revision: number;
  status: DraftStatus;
  payload: any; // The raw JSON draft object
  createdAtUtc: string;
}

interface OpsStoreState {
  drafts: Record<string, DraftRecord>; // Keyed by draftId
  activeDraftKeys: Record<string, string>; // Keyed by `actionType::targetId` -> draftId

  // Actions
  getActiveDraft: (targetId: string, actionType: string) => DraftRecord | undefined;
  createDraft: (targetId: string, actionType: string, draftId: string, payload: any) => void;
  supersedeDraft: (targetId: string, actionType: string, newDraftId: string, newPayload: any) => void;
  cancelDraft: (draftId: string) => void;
}

export const useOpsStore = create<OpsStoreState>()(
  persist(
    (set, get) => ({
      drafts: {},
      activeDraftKeys: {},

      getActiveDraft: (targetId, actionType) => {
        const key = `${actionType}::${targetId}`;
        const draftId = get().activeDraftKeys[key];
        return draftId ? get().drafts[draftId] : undefined;
      },

      createDraft: (targetId, actionType, draftId, payload) => {
        const key = `${actionType}::${targetId}`;
        if (get().activeDraftKeys[key]) {
          throw new Error("ACTIVE_DRAFT_COLLISION: An active draft already exists. It must be superseded.");
        }

        const newDraft: DraftRecord = {
          draftId,
          targetId,
          actionType,
          revision: 1,
          status: "ACTIVE",
          payload,
          createdAtUtc: new Date().toISOString(),
        };

        set((state) => ({
          drafts: { ...state.drafts, [draftId]: newDraft },
          activeDraftKeys: { ...state.activeDraftKeys, [key]: draftId },
        }));
      },

      supersedeDraft: (targetId, actionType, newDraftId, newPayload) => {
        const key = `${actionType}::${targetId}`;
        const currentDraftId = get().activeDraftKeys[key];
        
        if (!currentDraftId) throw new Error("NO_ACTIVE_DRAFT");

        const currentDraft = get().drafts[currentDraftId];

        const newDraft: DraftRecord = {
          draftId: newDraftId,
          targetId,
          actionType,
          revision: currentDraft.revision + 1,
          status: "ACTIVE",
          payload: newPayload,
          createdAtUtc: new Date().toISOString(),
        };

        set((state) => ({
          drafts: {
            ...state.drafts,
            [currentDraftId]: { ...currentDraft, status: "ARCHIVED" },
            [newDraftId]: newDraft,
          },
          activeDraftKeys: {
            ...state.activeDraftKeys,
            [key]: newDraftId,
          },
        }));
      },

      cancelDraft: (draftId) => {
        const draft = get().drafts[draftId];
        if (!draft) return;

        const key = `${draft.actionType}::${draft.targetId}`;
        const isActive = get().activeDraftKeys[key] === draftId;

        set((state) => {
          const nextActiveKeys = { ...state.activeDraftKeys };
          if (isActive) delete nextActiveKeys[key];

          return {
            drafts: {
              ...state.drafts,
              [draftId]: { ...draft, status: "CANCELLED" },
            },
            activeDraftKeys: nextActiveKeys,
          };
        });
      },
    }),
    { name: 'whenisdue-ops-storage' }
  )
);