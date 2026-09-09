import { act, renderHook } from '@testing-library/react';
import helpTopicDataMock from './helpTopicDataMock';
import useHelpTopicState from './useHelpTopicState';
import { resetHelpTopicsStore } from './helpTopicsStore';
import { getQuickstartsClient } from './quickstartsClient';

jest.mock('./quickstartsClient', () => ({
  getQuickstartsClient: jest.fn(),
}));

const mockedGetClient = getQuickstartsClient as jest.MockedFunction<
  typeof getQuickstartsClient
>;

describe('useHelpTopicState', () => {
  const helptopicsGet = jest.fn();

  beforeEach(() => {
    resetHelpTopicsStore();
    helptopicsGet.mockReset();
    mockedGetClient.mockReturnValue({
      helptopicsGet,
    } as ReturnType<typeof getQuickstartsClient>);
  });

  const initialTopics = helpTopicDataMock.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.name]: curr,
    }),
    {}
  );

  const initialActiveTopics = helpTopicDataMock.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.name]: true,
    }),
    {}
  );

  const initialState = {
    helpTopics: initialTopics,
    activeTopics: initialActiveTopics,
  };

  test('should initialize with help topics', () => {
    const { result } = renderHook(() => useHelpTopicState(initialState));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);
  });

  test('should add one new topic that is not in the array', () => {
    const { result } = renderHook(() => useHelpTopicState());

    act(() => {
      result.current.addHelpTopics([helpTopicDataMock[0]]);
    });

    expect(result.current.helpTopics).toEqual([helpTopicDataMock[0]]);
  });

  test('should add two new topics that is not in the array', () => {
    const { result } = renderHook(() => useHelpTopicState());

    act(() => {
      result.current.addHelpTopics(helpTopicDataMock);
    });

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);
  });

  test('should update existing help topic based on name', () => {
    const { result } = renderHook(() => useHelpTopicState(initialState));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.addHelpTopics([{ ...helpTopicDataMock[0], title: 'Foo' }]);
    });

    expect(result.current.helpTopics[0].title).toEqual('Foo');
    expect(result.current.helpTopics[1]).toEqual(helpTopicDataMock[1]);
    expect(result.current.helpTopics).toHaveLength(2);
  });

  test('should update existing topic and add a new topic', () => {
    const { result } = renderHook(() => useHelpTopicState(initialState));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.addHelpTopics([
        { ...helpTopicDataMock[0], title: 'Foo' },
        { ...helpTopicDataMock[1], name: 'New Topic' },
      ]);
    });

    expect(result.current.helpTopics[0].title).toEqual('Foo');
    expect(result.current.helpTopics).toHaveLength(3);
  });

  test('should add one new deactivated topic that is not in the array', () => {
    const { result } = renderHook(() => useHelpTopicState());

    act(() => {
      result.current.addHelpTopics([helpTopicDataMock[0]], false);
    });

    expect(result.current.helpTopics).toEqual([]);
  });

  test('should enable one help topic', () => {
    const { result } = renderHook(() =>
      useHelpTopicState({ helpTopics: initialTopics })
    );

    expect(result.current.helpTopics).toEqual([]);

    act(() => {
      result.current.enableTopics(helpTopicDataMock[0].name);
    });

    expect(result.current.helpTopics).toEqual([helpTopicDataMock[0]]);
  });

  test('should enable multiple help topics', () => {
    const { result } = renderHook(() =>
      useHelpTopicState({ helpTopics: initialTopics })
    );

    expect(result.current.helpTopics).toEqual([]);

    act(() => {
      result.current.enableTopics(
        helpTopicDataMock[0].name,
        helpTopicDataMock[1].name
      );
    });

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);
  });

  test('should disable one help topic', () => {
    const { result } = renderHook(() => useHelpTopicState(initialState));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.disableTopics(helpTopicDataMock[0].name);
    });

    expect(result.current.helpTopics).toEqual([helpTopicDataMock[1]]);
  });

  test('should disable multiple help topics', () => {
    const { result } = renderHook(() => useHelpTopicState(initialState));

    expect(result.current.helpTopics).toEqual(helpTopicDataMock);

    act(() => {
      result.current.disableTopics(
        helpTopicDataMock[0].name,
        helpTopicDataMock[1].name
      );
    });

    expect(result.current.helpTopics).toEqual([]);
  });

  test('should initialize topic asynchronously', async () => {
    const testTopicResponse = {
      name: 'test-topic',
      content: { name: 'test-topic', foo: 'bar' },
    };
    helptopicsGet.mockResolvedValueOnce({ data: [testTopicResponse] });
    const { result } = renderHook(() => useHelpTopicState());
    await act(async () => {
      await result.current.enableTopics('test-topic');
    });

    expect(helptopicsGet).toHaveBeenCalledWith({
      bundle: [],
      application: [],
      name: ['test-topic'],
    });
    expect(result.current.helpTopics).toEqual([testTopicResponse.content]);
  });
});
