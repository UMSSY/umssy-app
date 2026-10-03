export interface FileStorage {
  save(ownerId: string, content: Buffer): Promise<void>;
  read(ownerId: string): Promise<Buffer | null>;
  remove(ownerId: string): Promise<void>;
}
