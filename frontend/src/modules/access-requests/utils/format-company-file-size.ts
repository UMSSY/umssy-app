import { formatFileSize } from './format-file-size';

export function formatCompanyFileSize(bytes: number): string {
  return formatFileSize(bytes, {
    decimalSeparator: '.',
    kbDecimals: 1,
    mbDecimals: 2,
    allowBytesUnit: false,
  });
}
