import { CV_BULLET_PATTERN } from '../constants/cv-extraction.constants.js';

export function isCvBulletLine(line: string): boolean {
  return CV_BULLET_PATTERN.test(line);
}

export function stripCvBullet(line: string): string {
  return line.replace(CV_BULLET_PATTERN, '').trim();
}
