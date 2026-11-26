'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';
import { getProposalError } from '../utils/proposal-error';
import { proposalsService } from '../services/proposals.service';
import type { CreateProposalMutation } from '../types/create-proposal-mutation.types';

function isActiveProposalSession(capturedToken: string | null): boolean {
  return getAccessToken() === capturedToken && (Boolean(capturedToken) || hasCookieSession());
}

export function useCreateProposal(accessToken: string | null, onValidationError?: () => void) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ['event-proposals', 'create', accessToken],
    mutationFn: (variables: CreateProposalMutation) => {
      if (!isActiveProposalSession(variables.accessToken)) {
        throw new Error('La sesión cambió antes de enviar la propuesta.');
      }
      return proposalsService.create(variables.values, variables.cover, variables.operationKey, variables.accessToken, variables.sessions);
    },
    onSuccess: (_data, variables) => {
      if (!isActiveProposalSession(variables.accessToken)) return;
      void queryClient.invalidateQueries({ queryKey: ['event-proposals'] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error, variables) => {
      if (!isActiveProposalSession(variables.accessToken)) return;
      if (Object.keys(getProposalError(error).fields).length) onValidationError?.();
    },
    retry: false,
  });
  const failure = mutation.isError && mutation.variables?.accessToken === accessToken
    ? getProposalError(mutation.error)
    : null;
  return { ...mutation, failure };
}
