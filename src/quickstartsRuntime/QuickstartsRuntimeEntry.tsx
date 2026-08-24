import React, { Suspense, lazy } from 'react';
import type { QuickstartsRuntimeProps } from './QuickstartsRuntime';

/**
 * Federated expose entry. Must stay a tiny, hoisted default export that only
 * imports React. Chrome loads this module *via* Scalprum `LoadModule`, which
 * reads `module.default` during init. Importing `@patternfly/quickstarts` or
 * `@scalprum/*` in the same file puts those shared consumes on the stack and
 * throws `Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization`.
 */
const QuickstartsRuntimeImpl = lazy(() => import('./QuickstartsRuntime'));

export default function QuickstartsRuntime(props: QuickstartsRuntimeProps) {
  return (
    <Suspense fallback={props.children ?? null}>
      <QuickstartsRuntimeImpl {...props} />
    </Suspense>
  );
}
