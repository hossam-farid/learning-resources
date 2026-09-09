import { HelpTopic } from '@patternfly/quickstarts';
import { createSharedStore } from '@scalprum/core';

export interface HelpTopicsStoreState {
  helpTopics: {
    [name: string]: HelpTopic;
  };
  activeTopics: {
    [name: string]: boolean;
  };
}

const EVENTS = ['SET_HELP_TOPICS', 'SET_ACTIVE_TOPICS'] as const;

type Store = ReturnType<
  typeof createSharedStore<HelpTopicsStoreState, typeof EVENTS>
>;

let store: Store | null = null;

export function getHelpTopicsStore() {
  if (!store) {
    store = createSharedStore<HelpTopicsStoreState, typeof EVENTS>({
      initialState: { helpTopics: {}, activeTopics: {} },
      events: EVENTS,
      onEventChange: (
        state: HelpTopicsStoreState,
        event: (typeof EVENTS)[number],
        payload?: unknown
      ): HelpTopicsStoreState => {
        switch (event) {
          case 'SET_HELP_TOPICS': {
            const { helpTopics = [] } = (payload as {
              helpTopics?: HelpTopic[];
            }) || { helpTopics: [] };
            return {
              ...state,
              helpTopics: helpTopics.reduce(
                (acc, curr) => ({
                  ...acc,
                  [curr.name]: curr,
                }),
                { ...state.helpTopics }
              ),
            };
          }
          case 'SET_ACTIVE_TOPICS': {
            const { names = [], active } = (payload as {
              names?: string[];
              active?: boolean;
            }) || { names: [] };
            return {
              ...state,
              activeTopics: names.reduce(
                (acc, curr) => ({
                  ...acc,
                  [curr]: !!active,
                }),
                { ...state.activeTopics }
              ),
            };
          }
          default:
            return state;
        }
      },
    });
  }
  return store;
}

/** Test-only: drop the singleton so cases do not leak state. */
export function resetHelpTopicsStore() {
  store = null;
}
