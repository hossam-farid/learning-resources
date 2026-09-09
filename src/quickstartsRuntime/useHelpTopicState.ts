import { HelpTopic } from '@patternfly/quickstarts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuickstartsClient } from './quickstartsClient';
import { HelpTopicsStoreState, getHelpTopicsStore } from './helpTopicsStore';

export type AddHelpTopic = (topics: HelpTopic[], enabled?: boolean) => void;
export type DisableTopics = (...topicsNames: string[]) => void;
export type EnableTopics = (...topicNames: string[]) => Promise<HelpTopic[]>;

function unwrapHelpTopicRows(body: unknown): HelpTopic[] {
  const rows = Array.isArray(body)
    ? body
    : body &&
      typeof body === 'object' &&
      Array.isArray((body as { data?: unknown }).data)
    ? (body as { data: unknown[] }).data
    : [];
  return rows.map((row) => {
    if (row && typeof row === 'object' && 'content' in row) {
      return (row as { content: HelpTopic }).content;
    }
    return row as HelpTopic;
  });
}

const useHelpTopicState = (
  initialState: Partial<HelpTopicsStoreState> = {
    activeTopics: {},
    helpTopics: {},
  }
) => {
  const store = getHelpTopicsStore();
  const didSeed = useRef(false);
  if (!didSeed.current) {
    didSeed.current = true;
    const initialTopics = initialState.helpTopics || {};
    if (Object.keys(initialTopics).length > 0) {
      store.updateState('SET_HELP_TOPICS', {
        helpTopics: Object.values(initialTopics),
      });
    }
    const initialActive = initialState.activeTopics || {};
    if (Object.keys(initialActive).length > 0) {
      const active = Object.entries(initialActive)
        .filter(([, value]) => value)
        .map(([name]) => name);
      const inactive = Object.entries(initialActive)
        .filter(([, value]) => !value)
        .map(([name]) => name);
      if (active.length > 0) {
        store.updateState('SET_ACTIVE_TOPICS', { names: active, active: true });
      }
      if (inactive.length > 0) {
        store.updateState('SET_ACTIVE_TOPICS', {
          names: inactive,
          active: false,
        });
      }
    }
  }

  const [state, setState] = useState(() => store.getState());
  useEffect(
    () => store.subscribeAll(() => setState(store.getState())),
    [store]
  );

  const batchToggleTopic = useCallback(
    (names: string[], active: boolean) => {
      store.updateState('SET_ACTIVE_TOPICS', { names, active });
    },
    [store]
  );

  const addHelpTopics: AddHelpTopic = useCallback(
    (topics: HelpTopic[], enabled = true) => {
      store.updateState('SET_HELP_TOPICS', { helpTopics: topics });
      batchToggleTopic(
        topics.map(({ name }) => name),
        enabled
      );
    },
    [batchToggleTopic, store]
  );

  const fetchHelpTopics = useCallback(
    async ({
      bundles = [],
      applications = [],
      names = [],
      enabled = true,
    }: {
      enabled?: boolean;
      bundles?: string[];
      applications?: string[];
      names?: string[];
    }) => {
      try {
        const { data } = await getQuickstartsClient().helptopicsGet({
          bundle: bundles,
          application: applications,
          name: names,
        });
        const content = unwrapHelpTopicRows(data);
        addHelpTopics(content, enabled);
        return content;
      } catch (error) {
        console.error('Unable to fetch help topics', error);
        return [];
      }
    },
    [addHelpTopics]
  );

  const enableTopics: EnableTopics = useCallback(
    (...topicsNames: string[]) => {
      const { helpTopics } = store.getState();
      const newTopics: string[] = [];
      const existingTopics: string[] = [];
      topicsNames.forEach((name) => {
        if (typeof helpTopics[name] === 'undefined') {
          newTopics.push(name);
        } else {
          existingTopics.push(name);
        }
      });
      const tasks = [];
      if (newTopics.length > 0) {
        tasks.push(fetchHelpTopics({ enabled: true, names: newTopics }));
      }
      const existingContent: HelpTopic[] = Object.entries(helpTopics).reduce<
        HelpTopic[]
      >(
        (acc, [name, topic]) => [
          ...acc,
          ...(topicsNames.includes(name) ? [topic] : []),
        ],
        []
      );
      batchToggleTopic(existingTopics, true);
      return Promise.all(tasks).then((res) => [
        ...res.flat(),
        ...existingContent,
      ]);
    },
    [batchToggleTopic, fetchHelpTopics, store]
  );

  const disableTopics: DisableTopics = useCallback(
    (...topicsNames: string[]) => {
      batchToggleTopic(topicsNames, false);
    },
    [batchToggleTopic]
  );

  return {
    helpTopics: Object.values(state.helpTopics).filter(
      ({ name }) => state.activeTopics?.[name]
    ),
    addHelpTopics,
    disableTopics,
    enableTopics,
  };
};

export default useHelpTopicState;
