'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MY_SKILLS_QUERY_KEY,
  PENDING_SKILL_ID_PREFIX,
  SKILLS_ERROR_MESSAGES,
  SKILLS_SUCCESS_MESSAGES,
} from '../constants/skills.constants';
import { skillsService } from '../services/skills.service';
import type { Feedback } from '@/modules/profile';
import { useInvalidateProfileCompleteness } from '@/modules/profile';
import type { SkillItem } from '../types/skill-item.types';
import type { SkillsProfileResponse } from '../types/skills-profile-response.types';
import type { UseSkillsResult } from '../types/use-skills-result.types';
import { getSkillsErrorMessage } from '../utils/get-skills-error-message';
import { isManualSkill } from '../utils/is-manual-skill';
import { skillCatalogOptions } from './use-skill-catalog';

export function useSkills({
  forGuide = false,
}: { forGuide?: boolean } = {}): UseSkillsResult {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();
  const savingRef = useRef(false);
  const customRequestsRef = useRef(new Map<string, Promise<SkillItem>>());
  function resolveSkill(skill: SkillItem): Promise<SkillItem> {
    if (!skill.id.startsWith(PENDING_SKILL_ID_PREFIX))
      return Promise.resolve(skill);
    const existing = customRequestsRef.current.get(skill.id);
    if (existing) return existing;
    const request = skillsService
      .createCustomSkill(skill.name)
      .then((created) => {
        void queryClient.invalidateQueries({ queryKey: skillCatalogOptions.queryKey });
        queryClient.setQueryData<SkillsProfileResponse>(
          MY_SKILLS_QUERY_KEY,
          (current) =>
            current
              ? {
                  ...current,
                  catalog: [
                    ...current.catalog.filter((item) => item.id !== created.id),
                    created,
                  ],
                }
              : current,
        );
        return created;
      })
      .catch((error) => {
        customRequestsRef.current.delete(skill.id);
        throw error;
      });
    customRequestsRef.current.set(skill.id, request);
    return request;
  }
  const query = useQuery({
    queryKey: MY_SKILLS_QUERY_KEY,
    staleTime: forGuide ? 30_000 : undefined,
    queryFn: async () => {
      const [catalog, selected] = await Promise.all([
        queryClient.fetchQuery(skillCatalogOptions),
        skillsService.getMySkills(),
      ]);
      return { catalog, selected };
    },
  });
  const [draftSkills, setSelectedSkills] = useState<SkillItem[] | null>(null);
  const selectedSkills = draftSkills ?? query.data?.selected ?? [];
  const catalogSkills = query.data?.catalog ?? [];
  const savedIds = new Set(query.data?.selected.map((skill) => skill.id) ?? []);
  const hasUnsavedChanges =
    draftSkills !== null &&
    (draftSkills.length !== savedIds.size ||
      draftSkills.some((skill) => !savedIds.has(skill.id)));
  const isLoading = forGuide
    ? query.isPending || (query.isError && query.isFetching)
    : query.isFetching;
  const hasLoadError = query.isError;
  const [localFeedback, setFeedback] = useState<Feedback | null>(null);
  const feedback = query.error
    ? {
        type: 'error' as const,
        message: getSkillsErrorMessage(query.error, SKILLS_ERROR_MESSAGES.load),
      }
    : localFeedback;
  const mutation = useMutation({
    mutationFn: async (selection: SkillItem[]) => {
      const resolvedSkills = await Promise.all(selection.map(resolveSkill));
      const skillIds = [
        ...new Set(resolvedSkills.filter(isManualSkill).map(({ id }) => id)),
      ];
      return skillsService.saveMySkills(skillIds);
    },
    onSuccess: invalidateCompleteness,
  });
  const isSaving = mutation.isPending;
  async function reload(): Promise<void> {
    setSelectedSkills(null);
    setFeedback(null);
    await query.refetch();
  }

  function addSkill(skill: SkillItem): void {
    if (hasLoadError || isSaving) {
      return;
    }
    setSelectedSkills((current = []) =>
      (current ?? selectedSkills).some((selected) => selected.id === skill.id)
        ? current
        : [...(current ?? selectedSkills), skill],
    );
    setFeedback(null);
  }

  function removeSkill(skillId: string): void {
    if (hasLoadError || isSaving) {
      return;
    }
    setSelectedSkills((current = []) =>
      (current ?? selectedSkills).filter((skill) => skill.id !== skillId),
    );
    setFeedback(null);
  }

  function createCustomSkill(name: string): void {
    if (hasLoadError || isSaving) {
      return;
    }
    const trimmedName = (name ?? '').trim();
    if (!trimmedName) {
      return;
    }
    addSkill({
      id: `${PENDING_SKILL_ID_PREFIX}${trimmedName.toLowerCase()}`,
      name: trimmedName,
    });
  }

  async function saveSkills(
    selection: SkillItem[] = selectedSkills,
  ): Promise<boolean> {
    if (hasLoadError || isLoading || isSaving || savingRef.current) {
      return false;
    }

    savingRef.current = true;
    setFeedback(null);

    try {
      const savedSkills = await mutation.mutateAsync(selection);
      queryClient.setQueryData<SkillsProfileResponse>(
        MY_SKILLS_QUERY_KEY,
        (current) => ({
          catalog: current?.catalog ?? catalogSkills,
          selected: savedSkills ?? [],
        }),
      );
      setSelectedSkills(null);
      setFeedback({ type: 'success', message: SKILLS_SUCCESS_MESSAGES.saved });
      return true;
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getSkillsErrorMessage(error, SKILLS_ERROR_MESSAGES.save),
      });
      return false;
    } finally {
      savingRef.current = false;
    }
  }

  return {
    catalogSkills,
    selectedSkills,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    hasLoadError,
    feedback,
    addSkill,
    removeSkill,
    createCustomSkill,
    saveSkills,
    reload,
  };
}
