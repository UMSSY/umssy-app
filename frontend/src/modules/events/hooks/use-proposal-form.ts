'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/modules/profile';
import { getAccessToken, subscribeAccessToken } from '@/shared/services/storage/access-token-storage';
import { useEventCategories } from '@/modules/event-categories';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { useCreateProposal } from './use-create-proposal';
import { proposalDraftStorage } from '../services/proposal-draft-storage';
import { readProposalCover } from '../utils/read-proposal-cover';
import { validateProposal } from '../utils/proposal-validation';
import type { CreatedProposal, ProposalCover, ProposalValues } from '../types/proposal.types';

export function useProposalForm() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);
  const categories = useEventCategories();
  const profile = useQuery({ queryKey: ['session-profile', token], queryFn: () => profileService.getProfile(), enabled: Boolean(token), retry: false });
  const tutor = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ').trim();
  const [values, setValues] = useState<ProposalValues>({ ...EMPTY_PROPOSAL });
  const [cover, setCover] = useState<ProposalCover | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const creation = useCreateProposal(token, () => setReviewing(false));
  const pending = creation.isPending;
  const message = creation.failure?.message ?? null;
  const serverErrors = creation.failure?.fields ?? {};
  const [created, setCreated] = useState<CreatedProposal | null>(null);
  const operation = useRef<{ key: string; token: string | null } | null>(null);
  const sending = useRef(false);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const owner = token ? profile.data?.id ?? null : null;
  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    void proposalDraftStorage.read(owner).then(async (draft) => {
      const restoredCover = draft?.file ? await readProposalCover(draft.file) : null;
      if (cancelled) { if (restoredCover) URL.revokeObjectURL(restoredCover.previewUrl); return; }
      setReviewing(false); setValues(draft?.values ?? { ...EMPTY_PROPOSAL }); setCover(restoredCover);
      operation.current = draft?.operationKey ? { key: draft.operationKey, token } : null;
    }).catch(() => { if (!cancelled) setDraftWarning('No se pudo recuperar el borrador guardado en este navegador.'); })
      .finally(() => { if (!cancelled) setDraftOwner(owner); });
    return () => { cancelled = true; };
  }, [owner, token]);
  useEffect(() => {
    if (!owner || draftOwner !== owner || created) return;
    void proposalDraftStorage.save(owner, { values, file: cover?.file ?? null, operationKey: operation.current?.key ?? null })
      .catch(() => setDraftWarning('No se pudo guardar el borrador en este navegador. Mantén esta página abierta para conservarlo.'));
  }, [owner, draftOwner, values, cover, pending, created]);
  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover.previewUrl); }, [cover]);

  const validation = validateProposal(values, cover?.file ?? null, categories.categories.map(({ id }) => id));
  const errors = { ...(submitted ? validation : {}), ...serverErrors };
  const unavailable = !token || !tutor || profile.isError || categories.isLoading || Boolean(categories.error) || !categories.categories.length || Boolean(owner && draftOwner !== owner);

  function edit() { operation.current = null; creation.reset(); setCreated(null); }
  function change<K extends keyof ProposalValues>(key: K, value: ProposalValues[K]) {
    if (sending.current) return;
    edit();
    setValues((previous) => ({ ...previous, [key]: value, ...(key === 'modality' ? { location: '' } : {}) }));
  }
  function changeCover(next: ProposalCover | null) { edit(); setCover(next); }
  function review() {
    setSubmitted(true); creation.reset();
    if (unavailable || coverBusy || Object.keys(validation).length) return false;
    setReviewing(true); return true;
  }
  async function confirm() {
    if (sending.current || unavailable || coverBusy || !cover || Object.keys(validation).length) return;
    sending.current = true; creation.reset();
    if (!operation.current || operation.current.token !== token) operation.current = { key: crypto.randomUUID(), token };
    try {
      const result = await creation.mutateAsync({ values, cover: cover.file, operationKey: operation.current.key, accessToken: token });
      if (getAccessToken() !== token) return;
      if (owner) await proposalDraftStorage.remove(owner).catch(() => setDraftWarning('La propuesta se guardó, pero no se pudo limpiar el borrador local.'));
      setCreated(result); setReviewing(false); setValues({ ...EMPTY_PROPOSAL }); setCover(null); setSubmitted(false); operation.current = null;
    } catch {
      return;
    } finally { sending.current = false; }
  }
  return { values, cover, change, changeCover, coverBusy, setCoverBusy, errors, categories, profile, tutor,
    draftWarning, restoring: Boolean(owner && draftOwner !== owner), reviewing, closeReview: () => { if (!sending.current) setReviewing(false); }, review, confirm, pending, unavailable, message, created };
}
