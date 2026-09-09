import axios, { AxiosResponse } from 'axios';
import QuickstartsClient from '@redhat-cloud-services/quickstarts-client/api';
import type {
  HelptopicsGet200Response,
  ProgressGet200Response,
  QuickstartProgress,
  QuickstartsGet200Response,
} from '@redhat-cloud-services/quickstarts-client/types';
import type { HelptopicsGetParams } from '@redhat-cloud-services/quickstarts-client/HelptopicsGet';
import type { ProgressGetParams } from '@redhat-cloud-services/quickstarts-client/ProgressGet';
import type { ProgressPostParams } from '@redhat-cloud-services/quickstarts-client/ProgressPost';
import type { QuickstartsGetParams } from '@redhat-cloud-services/quickstarts-client/QuickstartsGet';

export const QUICKSTARTS_API_BASE = '/api/quickstarts/v1';

/**
 * The generated `./api` typings point at a broken monorepo path
 * (`packages/shared/dist/base`), so TypeScript treats the factory as `any`.
 * This is the subset the runtime hooks actually call.
 */
export type QuickstartsRuntimeClient = {
  progressGet: (
    params: ProgressGetParams
  ) => Promise<AxiosResponse<ProgressGet200Response>>;
  progressPost: (
    params: ProgressPostParams
  ) => Promise<AxiosResponse<QuickstartProgress>>;
  quickstartsGet: (
    params: QuickstartsGetParams
  ) => Promise<AxiosResponse<QuickstartsGet200Response>>;
  helptopicsGet: (
    params: HelptopicsGetParams
  ) => Promise<AxiosResponse<HelptopicsGet200Response>>;
};

let client: QuickstartsRuntimeClient | null = null;

export function getQuickstartsClient(): QuickstartsRuntimeClient {
  if (!client) {
    client = QuickstartsClient(QUICKSTARTS_API_BASE, {
      axios,
    }) as unknown as QuickstartsRuntimeClient;
  }
  return client;
}

/** Test-only: drop the singleton so mocks can replace it. */
export function resetQuickstartsClient() {
  client = null;
}
