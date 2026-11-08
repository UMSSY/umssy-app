export const hasOverlapErrorCode = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    meta?: { code?: unknown; driverAdapterError?: { cause?: { code?: unknown } } };
    message?: unknown;
  };

  if (candidate.code === '23P01') {
    return true;
  }

  if (typeof candidate.meta === 'object' && candidate.meta !== null) {
    if (candidate.meta.code === '23P01') {
      return true;
    }
    if (candidate.meta.driverAdapterError?.cause?.code === '23P01') {
      return true;
    }
  }

  return typeof candidate.message === 'string' && candidate.message.includes('23P01');
};
