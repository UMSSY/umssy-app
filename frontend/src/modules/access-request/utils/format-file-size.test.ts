import { describe, expect, it } from 'vitest';

import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2,0 KB');
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2,4 MB');
  });
});