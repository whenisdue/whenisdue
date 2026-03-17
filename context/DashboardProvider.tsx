"use client";

import React, { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

/** * =========================================================
 * DOMAIN TYPES
 * =========================================================
 */
export type Subscriber = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  globalPause: boolean;
};

export type Subscription = {
  id: string;
  stateCode: string;
  programName: string;
  identifierLabel: string;
  nextDepositDate: string; // ISO String: YYYY-MM-DD
  status: 'active' | 'paused';
  isSyncing?: boolean;
};

export type NotificationLog = {
  id: string;
  subscriptionId: string | null;
  subject: string;
  status: 'sent' | 'delivered' | 'retrying' | 'failed' | 'dead_letter';
  providerMessageId: string | null;
  sentAt: string; // ISO String
};

export type DashboardState = {
  account: {
    subscriber: Subscriber | null;
    isSyncing: boolean;
    lastConfirmedPauseState: boolean | null;
    error: string | null;
    isLoaded: boolean;
  };
  tracking: {
    subscriptions: Subscription[];
    nextOptimisticId: number; // SEAL: Invariant Sequence Counter
    error: string | null;
  };
  audit: {
    logs: NotificationLog[];
    filter: string;
  };
};

/** * =========================================================
 * DETERMINISTIC INVARIANT SORT
 * =========================================================
 */
const compareInvariant = (a: string, b: string) => {
  const normA = a.toUpperCase();
  const normB = b.toUpperCase();
  if (normA < normB) return -1;
  if (normA > normB) return 1;
  return 0;
};

const sortSubscriptions = (subs: Subscription[]): Subscription[] => {
  return [...subs].sort((a, b) => {
    const stateRes = compareInvariant(a.stateCode, b.stateCode);
    if (stateRes !== 0) return stateRes;
    const progRes = compareInvariant(a.programName, b.programName);
    if (progRes !== 0) return progRes;
    return compareInvariant(a.id, b.id);
  });
};

/** * =========================================================
 * ACTIONS & REDUCER
 * =========================================================
 */
type DashboardAction = 
  | { type: 'SET_INITIAL_DATA'; payload: { subscriber: Subscriber; subscriptions: Subscription[]; logs: NotificationLog[] } }
  | { type: 'START_GLOBAL_PAUSE_SYNC'; payload: boolean }
  | { type: 'COMMIT_GLOBAL_PAUSE' }
  | { type: 'ROLLBACK_GLOBAL_PAUSE'; payload: { error: string } }
  | { type: 'MARK_SUBSCRIPTION_DELETING'; payload: string }
  | { type: 'DELETE_SUBSCRIPTION_OPTIMISTIC'; payload: string }
  | { type: 'DELETE_SUBSCRIPTION_ROLLBACK'; payload: { sub: Subscription; error: string } }
  | { type: 'ADD_SUBSCRIPTION_OPTIMISTIC'; payload: Subscription }
  | { type: 'COMMIT_SUBSCRIPTION_ADD'; payload: { tempId: string; finalSub: Subscription } }
  | { type: 'ROLLBACK_SUBSCRIPTION_ADD'; payload: { tempId: string; error: string } }
  | { type: 'SET_AUDIT_FILTER'; payload: string }
  | { type: 'SET_AUDIT_LOGS'; payload: NotificationLog[] };

const initialState: DashboardState = {
  account: {
    subscriber: null,
    isSyncing: false,
    lastConfirmedPauseState: null,
    error: null,
    isLoaded: false,
  },
  tracking: {
    subscriptions: [],
    nextOptimisticId: 1000, 
    error: null,
  },
  audit: {
    logs: [],
    filter: '',
  }
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        account: { ...state.account, subscriber: action.payload.subscriber, isLoaded: true, error: null },
        tracking: { ...state.tracking, subscriptions: sortSubscriptions(action.payload.subscriptions), error: null },
        audit: { ...state.audit, logs: action.payload.logs }
      };

    case 'START_GLOBAL_PAUSE_SYNC':
      return {
        ...state,
        account: {
          ...state.account,
          isSyncing: true,
          error: null,
          lastConfirmedPauseState: state.account.subscriber?.globalPause ?? null,
          subscriber: state.account.subscriber ? { ...state.account.subscriber, globalPause: action.payload } : null
        }
      };

    case 'COMMIT_GLOBAL_PAUSE':
      return {
        ...state,
        account: { ...state.account, isSyncing: false, lastConfirmedPauseState: null, error: null }
      };

    case 'ROLLBACK_GLOBAL_PAUSE':
      return {
        ...state,
        account: {
          ...state.account,
          isSyncing: false,
          subscriber: state.account.subscriber ? { ...state.account.subscriber, globalPause: state.account.lastConfirmedPauseState ?? false } : null,
          lastConfirmedPauseState: null,
          error: action.payload.error
        }
      };

    case 'MARK_SUBSCRIPTION_DELETING':
      return {
        ...state,
        tracking: {
          ...state.tracking,
          error: null,
          subscriptions: state.tracking.subscriptions.map(s => s.id === action.payload ? { ...s, isSyncing: true } : s)
        }
      };

    case 'DELETE_SUBSCRIPTION_OPTIMISTIC':
      return {
        ...state,
        tracking: { ...state.tracking, error: null, subscriptions: state.tracking.subscriptions.filter(s => s.id !== action.payload) }
      };

    case 'DELETE_SUBSCRIPTION_ROLLBACK':
      return {
        ...state,
        tracking: {
          ...state.tracking,
          subscriptions: sortSubscriptions([...state.tracking.subscriptions, { ...action.payload.sub, isSyncing: false }]),
          error: action.payload.error
        }
      };

    case 'ADD_SUBSCRIPTION_OPTIMISTIC':
      return {
        ...state,
        tracking: {
          ...state.tracking,
          error: null,
          nextOptimisticId: state.tracking.nextOptimisticId + 1,
          subscriptions: sortSubscriptions([...state.tracking.subscriptions, action.payload])
        }
      };

    case 'COMMIT_SUBSCRIPTION_ADD': {
      const replaced = state.tracking.subscriptions.map(s => 
        s.id === action.payload.tempId ? { ...action.payload.finalSub, isSyncing: false } : s
      );
      return {
        ...state,
        tracking: {
          ...state.tracking,
          error: null,
          subscriptions: sortSubscriptions(replaced)
        }
      };
    }

    case 'ROLLBACK_SUBSCRIPTION_ADD':
      return {
        ...state,
        tracking: {
          ...state.tracking,
          error: action.payload.error,
          subscriptions: state.tracking.subscriptions.filter(s => s.id !== action.payload.tempId)
        }
      };

    case 'SET_AUDIT_FILTER':
      return {
        ...state,
        audit: { ...state.audit, filter: action.payload }
      };

    case 'SET_AUDIT_LOGS':
      return {
        ...state,
        audit: { ...state.audit, logs: action.payload }
      };

    default:
      return state;
  }
}

/** * =========================================================
 * CONTEXT & HOOK
 * =========================================================
 */
const DashboardContext = createContext<{ state: DashboardState; dispatch: React.Dispatch<DashboardAction> } | null>(null);

export function DashboardProvider({ children, initialData }: { 
  children: ReactNode, 
  initialData?: { subscriber: Subscriber; subscriptions: Subscription[]; logs: NotificationLog[] } 
}) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    ...(initialData ? {
      account: { ...initialState.account, subscriber: initialData.subscriber, isLoaded: true },
      tracking: { ...initialState.tracking, subscriptions: sortSubscriptions(initialData.subscriptions) },
      audit: { ...initialState.audit, logs: initialData.logs }
    } : {})
  });

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
}