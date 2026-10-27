export abstract class CvFileStorage {
  abstract create(userId: string, content: Buffer, fileName?: string): Promise<string>;
  abstract readById(userId: string, cvId: string): Promise<Buffer | null>;
  abstract removeById(userId: string, cvId: string): Promise<boolean>;
}
