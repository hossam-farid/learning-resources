import React, { Suspense, lazy } from 'react';
import { LoadingBox } from '@patternfly/quickstarts';

const QuickStartCatalog = lazy(() => import('./QuickStartCatalog'));

export const LazyQuickStartCatalog = ({
  ...props
}: Record<string, unknown>) => {
  const propsWithDefaults = {
    title: 'Quick starts',
    hint: 'Learn how to create, import, and manage your applications with step-by-step instructions and tasks.',
    showFilter: true,
    ...props,
  };
  return (
    <Suspense fallback={<LoadingBox />}>
      <QuickStartCatalog {...propsWithDefaults} />
    </Suspense>
  );
};
