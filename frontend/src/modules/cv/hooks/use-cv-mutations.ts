'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CV_FILE_QUERY_KEY, CV_QUERY_KEY } from '../constants/cv-api.constants';
import { CV_UPLOAD_PROGRESS } from '../constants/cv-upload.constants';
import { documentsService } from '../services/documents.service';
import { useInvalidateProfileCompleteness } from '@/modules/profile';
export function useCvMutations() {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();
  const [uploadProgress, setUploadProgress] = useState<number>(
    CV_UPLOAD_PROGRESS.min,
  );
  const cancelLoads = () =>
    queryClient.cancelQueries({ queryKey: CV_QUERY_KEY });
  const reloadCvs = () =>
    queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
  const refreshAfterSave = async () => {
    await Promise.allSettled([reloadCvs(), invalidateCompleteness()]);
  };
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentsService.uploadCv(file, setUploadProgress),
    onMutate: () => {
      setUploadProgress(CV_UPLOAD_PROGRESS.min);
      return cancelLoads();
    },
    onSuccess: refreshAfterSave,
    onSettled: () => setUploadProgress(CV_UPLOAD_PROGRESS.min),
  });
  const deleteMutation = useMutation({
    mutationFn: (cvId: string) => documentsService.deleteCv(cvId),
    onMutate: cancelLoads,
    onSuccess: (_result, cvId) => {
      queryClient.removeQueries({ queryKey: [...CV_FILE_QUERY_KEY, cvId] });
      return refreshAfterSave();
    },
  });
  return { uploadMutation, deleteMutation, uploadProgress };
}
