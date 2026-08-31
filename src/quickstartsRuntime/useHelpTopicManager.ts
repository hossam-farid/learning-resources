import { Reducer, useContext, useEffect, useReducer } from 'react';
import { HelpTopicContext } from '@patternfly/quickstarts';
import type {
  AddHelpTopic,
  DisableTopics,
  EnableTopics,
} from './useHelpTopicState';

export type HelpTopicsAPI = {
  addHelpTopics: AddHelpTopic;
  disableTopics: DisableTopics;
  enableTopics: EnableTopics;
};

type HelpTopicState = {
  activeTopicName?: string;
  prevActiveTopic?: string;
  internalTopicsSwitch: boolean;
};

type HelpTopicActions =
  | 'clearActiveTopic'
  | 'setActiveTopic'
  | 'setActiveTopicExternal'
  | 'setActiveTopicInternal'
  | 'resetActiveTopic';

type HelpTopicAction = {
  type: HelpTopicActions;
  activeTopicName?: string;
  prevActiveTopic?: string;
};

const helpTopicsReducer: Reducer<HelpTopicState, HelpTopicAction> = (
  state,
  action
) => {
  switch (action.type) {
    case 'setActiveTopic':
      return {
        ...state,
        activeTopicName: action.activeTopicName,
        prevActiveTopic: action.prevActiveTopic,
        internalTopicsSwitch: false,
      };
    case 'setActiveTopicExternal':
      return {
        ...state,
        internalTopicsSwitch: false,
        prevActiveTopic: action.prevActiveTopic,
      };
    case 'setActiveTopicInternal':
      return {
        ...state,
        prevActiveTopic: action.prevActiveTopic,
        internalTopicsSwitch: true,
      };
    case 'resetActiveTopic': {
      return {
        ...state,
        prevActiveTopic: undefined,
        internalTopicsSwitch: false,
      };
    }
    default:
      return state;
  }
};

const useHelpTopicManager = (helpTopicsAPI: HelpTopicsAPI) => {
  const [{ activeTopicName, internalTopicsSwitch, prevActiveTopic }, dispatch] =
    useReducer(helpTopicsReducer, {
      internalTopicsSwitch: false,
    });

  const { setActiveHelpTopicByName, helpTopics, activeHelpTopic } =
    useContext(HelpTopicContext);

  async function setActiveTopic(
    activeTopicName: string,
    prevActiveTopic?: string
  ) {
    dispatch({ type: 'setActiveTopic', activeTopicName, prevActiveTopic });
    if (activeTopicName?.length > 0) {
      helpTopicsAPI.enableTopics(activeTopicName);
    }
  }

  useEffect(() => {
    if (prevActiveTopic && activeHelpTopic === null) {
      setActiveTopic('', undefined);
    } else {
      if (
        activeHelpTopic?.name &&
        prevActiveTopic === activeTopicName &&
        activeHelpTopic?.name !== activeTopicName
      ) {
        setActiveHelpTopicByName?.(activeHelpTopic.name);
        dispatch({ type: 'setActiveTopicInternal', prevActiveTopic });
      } else if (
        typeof activeTopicName === 'string' &&
        activeTopicName?.length > 0
      ) {
        if (helpTopics?.find(({ name }) => name === activeTopicName)) {
          setActiveHelpTopicByName?.(activeTopicName);
          dispatch({
            type: 'setActiveTopicExternal',
            prevActiveTopic: activeTopicName,
          });
        }
      } else {
        setActiveHelpTopicByName?.('');
        dispatch({ type: 'resetActiveTopic' });
      }
    }
  }, [activeTopicName, helpTopics, activeHelpTopic, internalTopicsSwitch]);
  return {
    setActiveTopic,
  };
};

export default useHelpTopicManager;
