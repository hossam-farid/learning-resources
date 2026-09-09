import { QuickStart } from '@patternfly/quickstarts';
import { createSharedStore } from '@scalprum/core';

export interface QuickstartsStoreState {
  quickstarts: { [key: string]: QuickStart[] };
  disabled: boolean;
}

const EVENTS = [
  'POPULATE_QUICKSTARTS',
  'ADD_QUICKSTART',
  'CLEAR_QUICKSTARTS',
  'TOGGLE_DISABLED',
] as const;

let store: ReturnType<
  typeof createSharedStore<QuickstartsStoreState, typeof EVENTS>
> | null = null;

export function getQuickstartsStore() {
  if (!store) {
    store = createSharedStore<QuickstartsStoreState, typeof EVENTS>({
      initialState: { quickstarts: {}, disabled: false },
      events: EVENTS,
      onEventChange: (
        state: QuickstartsStoreState,
        event: (typeof EVENTS)[number],
        payload?: unknown
      ): QuickstartsStoreState => {
        switch (event) {
          case 'POPULATE_QUICKSTARTS': {
            const { app, quickstarts } = payload as {
              app: string;
              quickstarts: QuickStart[];
            };
            return {
              ...state,
              quickstarts: {
                ...state.quickstarts,
                [app]: quickstarts,
              },
            };
          }
          case 'ADD_QUICKSTART': {
            const { app, quickstart } = payload as {
              app: string;
              quickstart: QuickStart;
            };
            return {
              ...state,
              quickstarts: {
                ...state.quickstarts,
                [app]: [...(state.quickstarts[app] ?? []), quickstart],
              },
            };
          }
          case 'CLEAR_QUICKSTARTS': {
            const activeQuickstart = payload as string | undefined;
            const cleared = Object.entries(state.quickstarts).reduce<{
              [key: string]: QuickStart[];
            }>((acc, [namespace, quickstarts]) => {
              const kept = quickstarts.filter(
                (qs) => qs?.metadata?.name === activeQuickstart
              );
              if (kept.length > 0) {
                acc[namespace] = kept;
              }
              return acc;
            }, {});
            return { ...state, quickstarts: cleared };
          }
          case 'TOGGLE_DISABLED':
            return {
              ...state,
              disabled:
                typeof payload === 'boolean' ? payload : !state.disabled,
            };
          default:
            return state;
        }
      },
    });
  }
  return store;
}

/** Test-only: drop the singleton so cases do not leak state. */
export function resetQuickstartsStore() {
  store = null;
}
