import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import QuickstartsRuntime from './QuickstartsRuntime';
import { getQuickstartsClient } from './quickstartsClient';
import { resetHelpTopicsStore } from './helpTopicsStore';
import { resetQuickstartsStore } from './quickstartsStore';

jest.mock('./quickstartsClient', () => ({
  getQuickstartsClient: jest.fn(),
}));

jest.mock('./useQuickstartLinkStore', () => ({
  __esModule: true,
  default: () => ({ addLinkElement: jest.fn(), emptyElements: jest.fn() }),
  createQuickstartLinkMarkupExtension: () => ({
    type: 'lang',
    regex: /$^/,
    replace: (t: string) => t,
  }),
}));

jest.mock('@patternfly/quickstarts', () => {
  const ReactActual = jest.requireActual('react');
  const HelpTopicContext = ReactActual.createContext({
    setFilteredHelpTopics: jest.fn(),
    setActiveHelpTopicByName: jest.fn(),
    helpTopics: [],
    activeHelpTopic: null,
  });
  return {
    HelpTopicContext,
    QuickStartContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="quickstart-container">{children}</div>
    ),
    HelpTopicContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="helptopic-container">{children}</div>
    ),
  };
});

const mockedGetClient = getQuickstartsClient as jest.MockedFunction<
  typeof getQuickstartsClient
>;

describe('QuickstartsRuntime', () => {
  beforeEach(() => {
    resetHelpTopicsStore();
    resetQuickstartsStore();
    mockedGetClient.mockReturnValue({
      progressGet: jest.fn().mockResolvedValue({ data: { data: [] } }),
      progressPost: jest.fn().mockResolvedValue({ data: {} }),
      quickstartsGet: jest.fn().mockResolvedValue({ data: { data: [] } }),
      helptopicsGet: jest.fn().mockResolvedValue({ data: [] }),
    } as ReturnType<typeof getQuickstartsClient>);
  });

  it('renders children inside the runtime providers', async () => {
    await act(async () => {
      render(
        <QuickstartsRuntime>
          <span>child-content</span>
        </QuickstartsRuntime>
      );
    });

    expect(screen.getByText('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('quickstart-container')).toBeInTheDocument();
    expect(screen.getByTestId('helptopic-container')).toBeInTheDocument();
  });

  it('publishes quickstarts and helpTopics APIs via onApiReady', async () => {
    const onApiReady = jest.fn();

    await act(async () => {
      render(
        <QuickstartsRuntime onApiReady={onApiReady}>
          <span>child-content</span>
        </QuickstartsRuntime>
      );
    });

    await waitFor(() => expect(onApiReady).toHaveBeenCalled());
    const api = onApiReady.mock.calls[0][0];
    expect(api.quickstartsAPI).toEqual(
      expect.objectContaining({
        version: 1,
        set: expect.any(Function),
        activateQuickstart: expect.any(Function),
        toggle: expect.any(Function),
        add: expect.any(Function),
        updateQuickStarts: expect.any(Function),
      })
    );
    expect(api.helpTopicsAPI).toEqual(
      expect.objectContaining({
        addHelpTopics: expect.any(Function),
        enableTopics: expect.any(Function),
        disableTopics: expect.any(Function),
        setActiveTopic: expect.any(Function),
        closeHelpTopic: expect.any(Function),
      })
    );
  });

  it('notifies when the active quickstart id changes', async () => {
    const onActiveQuickStartChanged = jest.fn();
    const onApiReady = jest.fn();

    await act(async () => {
      render(
        <QuickstartsRuntime
          onApiReady={onApiReady}
          onActiveQuickStartChanged={onActiveQuickStartChanged}
        >
          <span>child-content</span>
        </QuickstartsRuntime>
      );
    });

    await waitFor(() => expect(onApiReady).toHaveBeenCalled());
    const { quickstartsAPI } = onApiReady.mock.calls[0][0];

    await act(async () => {
      quickstartsAPI.toggle('getting-started');
    });

    expect(onActiveQuickStartChanged).toHaveBeenCalledWith('getting-started');
  });
});
