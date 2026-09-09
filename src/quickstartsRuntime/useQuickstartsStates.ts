import { useCallback, useEffect, useMemo, useState } from 'react';
import { QuickStart, QuickStartState } from '@patternfly/quickstarts';
import type { QuickstartsGet200Response } from '@redhat-cloud-services/quickstarts-client/types';
import { getQuickstartsClient } from './quickstartsClient';
import { getQuickstartsStore } from './quickstartsStore';

function unwrapQuickstartContent(
  body: QuickstartsGet200Response | undefined
): QuickStart[] {
  return (body?.data ?? [])
    .map((row) => row.content)
    .filter((content): content is object => Boolean(content))
    .map((content) => content as QuickStart);
}

const useQuickstartsStates = (accountId?: string) => {
  const quickstartsStore = getQuickstartsStore();
  const client = getQuickstartsClient();

  const [allQuickStartStates, setAllQuickStartStatesInternal] = useState<{
    [key: string | number]: QuickStartState;
  }>({});
  const [activeQuickStartID, setActiveQuickStartIDInternal] = useState('');

  const setAllQuickStartStates = useCallback(
    (
      value:
        | QuickStartState
        | ((states: typeof allQuickStartStates) => QuickStartState)
    ) => {
      const valueToStore =
        typeof value === 'function' ? value(allQuickStartStates) : value;
      const activeState = valueToStore[activeQuickStartID];

      if (typeof activeState === 'object') {
        client
          .progressPost({
            quickstartProgressRequest: {
              quickstartName: activeQuickStartID,
              accountId: parseInt(accountId!, 10),
              progress: activeState,
            },
          })
          .catch((err: unknown) => {
            console.error(
              `Unable to persis quickstart progress! ${activeQuickStartID}`,
              err
            );
          });
      }
      setAllQuickStartStatesInternal(
        value as unknown as typeof allQuickStartStates
      );
    },
    [activeQuickStartID, accountId, allQuickStartStates, client]
  );

  const setActiveQuickStartID = useCallback((id: string) => {
    if (id !== '' && typeof id !== 'function') {
      document.body.classList.add('quickstarts-open');
    } else {
      document.body.classList.remove('quickstarts-open');
    }
    setActiveQuickStartIDInternal(id);
  }, []);

  useEffect(() => {
    if (accountId) {
      client
        .progressGet({ account: accountId })
        .then((response) => {
          const records = response.data?.data ?? [];
          const states = records.reduce<{ [key: string]: QuickStartState }>(
            (acc, curr) => ({
              ...acc,
              [curr.quickstartName as string]: curr.progress as QuickStartState,
            }),
            {}
          );
          setAllQuickStartStatesInternal(states);
        })
        .catch((error: unknown) => {
          console.error(error);
        });
    }
  }, [accountId, client]);

  const populateQuickstarts = useCallback(
    (payload: { app: string; quickstarts: QuickStart[] }) => {
      quickstartsStore.updateState('POPULATE_QUICKSTARTS', payload);
    },
    [quickstartsStore]
  );

  const activateQuickstart = useCallback(
    async (name: string) => {
      try {
        const { data } = await client.quickstartsGet({ name });
        const mainQuickstarts = unwrapQuickstartContent(data);

        const nextQuickStartNames = mainQuickstarts
          .flatMap((qs) => qs.spec.nextQuickStart || [])
          .filter((nextName, index, arr) => arr.indexOf(nextName) === index);

        let nextQuickstarts: QuickStart[] = [];
        if (nextQuickStartNames.length > 0) {
          try {
            const responses = await Promise.all(
              nextQuickStartNames.map((nextName) =>
                client.quickstartsGet({ name: nextName })
              )
            );
            nextQuickstarts = responses.flatMap((r) =>
              unwrapQuickstartContent(r.data)
            );
          } catch (error) {
            console.warn(
              'Some referenced quickstarts could not be fetched:',
              error
            );
          }
        }

        populateQuickstarts({
          app: 'default',
          quickstarts: [...mainQuickstarts, ...nextQuickstarts],
        });

        setActiveQuickStartID(name);
      } catch (error) {
        console.error('Unable to active quickstarts called: ', name, error);
      }
    },
    [client, populateQuickstarts, setActiveQuickStartID]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quickstartParam = params.get('quickstart');
    if (typeof quickstartParam === 'string' && quickstartParam.length > 0) {
      activateQuickstart(quickstartParam);
    }
  }, []);

  const quickstartState = useMemo(
    () => ({
      activateQuickstart,
      allQuickStartStates,
      setAllQuickStartStates,
      activeQuickStartID,
      setActiveQuickStartID,
    }),
    [
      activateQuickstart,
      allQuickStartStates,
      setAllQuickStartStates,
      activeQuickStartID,
      setActiveQuickStartID,
    ]
  );

  return quickstartState;
};

export default useQuickstartsStates;
