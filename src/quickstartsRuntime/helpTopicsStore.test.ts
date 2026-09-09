import { HelpTopic } from '@patternfly/quickstarts';
import { getHelpTopicsStore, resetHelpTopicsStore } from './helpTopicsStore';

const topic = (name: string, title = name): HelpTopic =>
  ({
    name,
    title,
    tags: [],
    content: `${name} content`,
    links: [],
  } as HelpTopic);

describe('helpTopicsStore', () => {
  beforeEach(() => {
    resetHelpTopicsStore();
  });

  it('starts empty', () => {
    expect(getHelpTopicsStore().getState()).toEqual({
      helpTopics: {},
      activeTopics: {},
    });
  });

  it('merges help topics by name', () => {
    const store = getHelpTopicsStore();
    store.updateState('SET_HELP_TOPICS', { helpTopics: [topic('a', 'A')] });
    store.updateState('SET_HELP_TOPICS', {
      helpTopics: [topic('a', 'A2'), topic('b', 'B')],
    });
    expect(store.getState().helpTopics.a.title).toBe('A2');
    expect(store.getState().helpTopics.b.title).toBe('B');
  });

  it('toggles active topics', () => {
    const store = getHelpTopicsStore();
    store.updateState('SET_ACTIVE_TOPICS', {
      names: ['a', 'b'],
      active: true,
    });
    expect(store.getState().activeTopics).toEqual({ a: true, b: true });
    store.updateState('SET_ACTIVE_TOPICS', { names: ['a'], active: false });
    expect(store.getState().activeTopics).toEqual({ a: false, b: true });
  });
});
