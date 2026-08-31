import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  HelpTopic,
  HelpTopicContainer,
  HelpTopicContext,
  QuickStart,
  QuickStartContainer,
  QuickStartContainerProps,
} from '@patternfly/quickstarts';
import useQuickstartsStates from './useQuickstartsStates';
import useHelpTopicState from './useHelpTopicState';
import useHelpTopicManager from './useHelpTopicManager';
import useQuickstartLinkStore, {
  createQuickstartLinkMarkupExtension,
} from './useQuickstartLinkStore';
import validateQuickstart from './quickstartValidation';
import { QuickstartsStoreState, getQuickstartsStore } from './quickstartsStore';
import { LazyQuickStartCatalog } from './LazyQuickStartCatalog';

/**
 * Subscribe to the Scalprum shared store without importing `@scalprum/react-core`.
 * That package's barrel also exports ScalprumComponent/LoadModule. Importing it from
 * this federated module (which Chrome loads *via* ScalprumComponent) creates a
 * webpack TDZ cycle: `Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization`.
 */
function useQuickstartsStoreState(
  store: ReturnType<typeof getQuickstartsStore>
): QuickstartsStoreState {
  const [state, setState] = useState(() => store.getState());
  useEffect(
    () => store.subscribeAll(() => setState(store.getState())),
    [store]
  );
  return state;
}

export interface QuickstartsRuntimeProps {
  accountId?: string;
  activeModule?: string;
  children?: React.ReactNode;
  onApiReady?: (api: {
    quickstartsAPI: QuickstartsAPI;
    helpTopicsAPI: FullHelpTopicsAPI;
  }) => void;
  onActiveQuickStartChanged?: (id: string) => void;
}

export interface QuickstartsAPI {
  version: number;
  set: (key: string, quickstarts: QuickStart[]) => void;
  activateQuickstart: (name: string) => Promise<void>;
  add: (key: string, qs: QuickStart) => boolean;
  toggle: (quickstart: string) => void;
  Catalog: typeof LazyQuickStartCatalog;
  updateQuickStarts: (key: string, quickstarts: QuickStart[]) => void;
}

export interface FullHelpTopicsAPI {
  addHelpTopics: ReturnType<typeof useHelpTopicState>['addHelpTopics'];
  disableTopics: (...topicsNames: string[]) => void;
  enableTopics: (...names: EnableTopicsArgs) => Promise<HelpTopic[]>;
  setActiveTopic: (name: string, prevActiveTopic?: string) => Promise<void>;
  closeHelpTopic: () => void;
}

type EnableTopicsArgs = [{ names: string[]; append?: boolean }] | string[];

function isStringArray(arr: EnableTopicsArgs): arr is string[] {
  return typeof arr[0] === 'string';
}

const ApiPublisher: React.FC<{
  baseHelpTopicsAPI: ReturnType<typeof useHelpTopicState>;
  quickstartsAPI: QuickstartsAPI;
  activeModule?: string;
  onApiReady?: QuickstartsRuntimeProps['onApiReady'];
}> = ({ baseHelpTopicsAPI, quickstartsAPI, activeModule, onApiReady }) => {
  const { setFilteredHelpTopics } = useContext(HelpTopicContext);
  const internalFilteredTopics = useRef<HelpTopic[]>([]);
  const { setActiveTopic } = useHelpTopicManager(baseHelpTopicsAPI);

  const enableTopics = useCallback(
    async (...names: EnableTopicsArgs) => {
      let internalNames: string[] = [];
      let shouldAppend = false;
      if (isStringArray(names)) {
        internalNames = names;
      } else {
        internalNames = names[0].names;
        shouldAppend = !!names[0].append;
      }
      return baseHelpTopicsAPI.enableTopics(...internalNames).then((res) => {
        internalFilteredTopics.current = shouldAppend
          ? [
              ...internalFilteredTopics.current,
              ...res.filter(
                (topic) =>
                  !internalFilteredTopics.current.find(
                    ({ name }) => name === topic.name
                  )
              ),
            ]
          : res;
        setFilteredHelpTopics?.(internalFilteredTopics.current);
        return res;
      });
    },
    [baseHelpTopicsAPI, setFilteredHelpTopics]
  );

  const disableTopics = useCallback(
    (...topicsNames: string[]) => {
      baseHelpTopicsAPI.disableTopics(...topicsNames);
      internalFilteredTopics.current = internalFilteredTopics.current.filter(
        (topic) => !topicsNames.includes(topic.name)
      );
      setFilteredHelpTopics?.(internalFilteredTopics.current);
    },
    [baseHelpTopicsAPI, setFilteredHelpTopics]
  );

  const closeHelpTopic = useCallback(() => {
    setActiveTopic('');
  }, [setActiveTopic]);

  const fullHelpTopicsAPI: FullHelpTopicsAPI = useMemo(
    () => ({
      addHelpTopics: baseHelpTopicsAPI.addHelpTopics,
      enableTopics,
      disableTopics,
      setActiveTopic,
      closeHelpTopic,
    }),
    [
      baseHelpTopicsAPI.addHelpTopics,
      enableTopics,
      disableTopics,
      setActiveTopic,
      closeHelpTopic,
    ]
  );

  useEffect(() => {
    onApiReady?.({ quickstartsAPI, helpTopicsAPI: fullHelpTopicsAPI });
  }, [onApiReady, quickstartsAPI, fullHelpTopicsAPI]);

  useEffect(() => {
    setActiveTopic('');
  }, [activeModule]);

  return null;
};

export default function QuickstartsRuntime({
  accountId,
  activeModule,
  children,
  onApiReady,
  onActiveQuickStartChanged,
}: QuickstartsRuntimeProps) {
  const quickstartsStore = getQuickstartsStore();
  const quickstartLinkStore = useQuickstartLinkStore();
  const {
    activateQuickstart,
    allQuickStartStates,
    setAllQuickStartStates,
    activeQuickStartID,
    setActiveQuickStartID,
  } = useQuickstartsStates(accountId);
  const baseHelpTopicsAPI = useHelpTopicState();

  const storeState = useQuickstartsStoreState(quickstartsStore);
  const quickStarts = useMemo(
    () => Object.values(storeState.quickstarts).flat(),
    [storeState.quickstarts]
  );

  useEffect(() => {
    quickstartsStore.updateState('CLEAR_QUICKSTARTS', activeQuickStartID);
  }, [activeModule]);

  useEffect(() => {
    onActiveQuickStartChanged?.(activeQuickStartID);
  }, [activeQuickStartID]);

  const updateQuickStarts = useCallback(
    (key: string, qs: QuickStart[]) => {
      quickstartsStore.updateState('POPULATE_QUICKSTARTS', {
        app: key,
        quickstarts: qs,
      });
    },
    [quickstartsStore]
  );

  const addQuickstart = useCallback(
    (key: string, qs: QuickStart): boolean => {
      if (validateQuickstart(key, qs)) {
        quickstartsStore.updateState('ADD_QUICKSTART', {
          app: key,
          quickstart: qs,
        });
        return true;
      }
      return false;
    },
    [quickstartsStore]
  );

  const quickstartsAPI: QuickstartsAPI = useMemo(
    () => ({
      version: 1,
      set: updateQuickStarts,
      activateQuickstart,
      add: addQuickstart,
      toggle: setActiveQuickStartID,
      Catalog: LazyQuickStartCatalog,
      updateQuickStarts,
    }),
    [
      activateQuickstart,
      setActiveQuickStartID,
      updateQuickStarts,
      addQuickstart,
    ]
  );

  const quickStartProps: QuickStartContainerProps = {
    quickStarts,
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID:
      setActiveQuickStartID as QuickStartContainerProps['setActiveQuickStartID'],
    setAllQuickStartStates:
      setAllQuickStartStates as unknown as QuickStartContainerProps['setAllQuickStartStates'],
    showCardFooters: false,
    language: 'en',
    alwaysShowTaskReview: true,
    markdown: {
      extensions: [createQuickstartLinkMarkupExtension(quickstartLinkStore)],
    },
  };

  return (
    <QuickStartContainer {...quickStartProps}>
      <HelpTopicContainer helpTopics={baseHelpTopicsAPI.helpTopics}>
        <ApiPublisher
          baseHelpTopicsAPI={baseHelpTopicsAPI}
          quickstartsAPI={quickstartsAPI}
          activeModule={activeModule}
          onApiReady={onApiReady}
        />
        {children}
      </HelpTopicContainer>
    </QuickStartContainer>
  );
}
