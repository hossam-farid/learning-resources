import { QuickStart } from '@patternfly/quickstarts';
import { getQuickstartsStore, resetQuickstartsStore } from './quickstartsStore';

const qs = (name: string): QuickStart =>
  ({
    metadata: { name },
    spec: { displayName: name, icon: null, description: '', tasks: [] },
  } as unknown as QuickStart);

describe('quickstartsStore', () => {
  beforeEach(() => {
    resetQuickstartsStore();
  });

  it('starts empty', () => {
    expect(getQuickstartsStore().getState()).toEqual({
      quickstarts: {},
      disabled: false,
    });
  });

  it('populates quickstarts for an app', () => {
    const store = getQuickstartsStore();
    store.updateState('POPULATE_QUICKSTARTS', {
      app: 'insights',
      quickstarts: [qs('one')],
    });
    expect(store.getState().quickstarts.insights).toEqual([qs('one')]);
  });

  it('adds a quickstart to an app', () => {
    const store = getQuickstartsStore();
    store.updateState('POPULATE_QUICKSTARTS', {
      app: 'insights',
      quickstarts: [qs('one')],
    });
    store.updateState('ADD_QUICKSTART', {
      app: 'insights',
      quickstart: qs('two'),
    });
    expect(
      store.getState().quickstarts.insights.map((q) => q.metadata.name)
    ).toEqual(['one', 'two']);
  });

  it('clears all but the active quickstart', () => {
    const store = getQuickstartsStore();
    store.updateState('POPULATE_QUICKSTARTS', {
      app: 'insights',
      quickstarts: [qs('one'), qs('keep')],
    });
    store.updateState('CLEAR_QUICKSTARTS', 'keep');
    expect(store.getState().quickstarts.insights).toEqual([qs('keep')]);
  });

  it('toggles disabled', () => {
    const store = getQuickstartsStore();
    store.updateState('TOGGLE_DISABLED');
    expect(store.getState().disabled).toBe(true);
    store.updateState('TOGGLE_DISABLED', false);
    expect(store.getState().disabled).toBe(false);
  });
});
