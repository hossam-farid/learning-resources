import { act, renderHook } from '@testing-library/react';
import { QuickStartState } from '@patternfly/quickstarts';
import useQuickstartsStates from './useQuickstartsStates';
import { getQuickstartsClient } from './quickstartsClient';
import { resetQuickstartsStore } from './quickstartsStore';

jest.mock('./quickstartsClient', () => ({
  getQuickstartsClient: jest.fn(),
}));

const mockedGetClient = getQuickstartsClient as jest.MockedFunction<
  typeof getQuickstartsClient
>;

describe('useQuickstartsStates', () => {
  const progressGet = jest.fn();
  const progressPost = jest.fn();
  const quickstartsGet = jest.fn();

  beforeEach(() => {
    resetQuickstartsStore();
    progressGet.mockReset().mockResolvedValue({ data: { data: [] } });
    progressPost.mockReset().mockResolvedValue({ data: {} });
    quickstartsGet.mockReset();
    mockedGetClient.mockReturnValue({
      progressGet,
      progressPost,
      quickstartsGet,
    } as ReturnType<typeof getQuickstartsClient>);
  });

  test('should not call API if no account Id exists', () => {
    const { result } = renderHook(() => useQuickstartsStates());

    expect(progressGet).not.toHaveBeenCalled();
    expect(result.current.activeQuickStartID).toBe('');
  });

  test('should call quickstarts progress API if account id exists', async () => {
    let result: { current: ReturnType<typeof useQuickstartsStates> };
    await act(async () => {
      const rendered = renderHook(() => useQuickstartsStates('123'));
      result = rendered.result;
    });

    expect(progressGet).toHaveBeenCalledTimes(1);
    expect(progressGet).toHaveBeenCalledWith({ account: '123' });
    expect(result!.current.activeQuickStartID).toBe('');
    expect(result!.current.allQuickStartStates).toEqual({});
  });

  test('should call quickstarts progress API and parse the response', async () => {
    progressGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            quickstartName: 'test-name',
            accountId: 123,
            progress: { foo: 'bar' },
          },
        ],
      },
    });

    let result: { current: ReturnType<typeof useQuickstartsStates> };
    await act(async () => {
      const rendered = renderHook(() => useQuickstartsStates('123'));
      result = rendered.result;
    });

    expect(progressGet).toHaveBeenCalledTimes(1);
    expect(result!.current.allQuickStartStates).toEqual({
      'test-name': { foo: 'bar' },
    });
  });

  test('should set active quickstart id', () => {
    const { result } = renderHook(() => useQuickstartsStates());

    act(() => {
      result.current.setActiveQuickStartID('test-id');
    });
    expect(result.current.activeQuickStartID).toBe('test-id');
  });

  test('should set quickstarts states from object', () => {
    const { result } = renderHook(() => useQuickstartsStates());

    act(() => {
      result.current.setAllQuickStartStates({ foo: 'bar' });
    });
    expect(result.current.allQuickStartStates).toEqual({ foo: 'bar' });
  });

  test('should post quickstarts progress update to quickstarts API', async () => {
    const { result } = renderHook(() => useQuickstartsStates('123'));

    act(() => {
      result.current.setActiveQuickStartID('test-id');
    });

    await act(async () => {
      result.current.setAllQuickStartStates({
        'test-id': { status: 'In Progress' },
      } as unknown as QuickStartState);
    });

    expect(progressPost).toHaveBeenCalledWith({
      quickstartProgressRequest: {
        quickstartName: 'test-id',
        accountId: 123,
        progress: { status: 'In Progress' },
      },
    });
  });

  test('should activate a quickstart by name', async () => {
    quickstartsGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            content: {
              metadata: { name: 'getting-started' },
              spec: { displayName: 'Getting started', nextQuickStart: [] },
            },
          },
        ],
      },
    });

    const { result } = renderHook(() => useQuickstartsStates('123'));

    await act(async () => {
      await result.current.activateQuickstart('getting-started');
    });

    expect(quickstartsGet).toHaveBeenCalledWith({ name: 'getting-started' });
    expect(result.current.activeQuickStartID).toBe('getting-started');
  });
});
