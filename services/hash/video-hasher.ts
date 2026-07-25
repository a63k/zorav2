import { createHash } from 'crypto';

export class VideoHasherService {
  /**
   * Generates a SHA-256 hash from a Buffer or ArrayBuffer
   */
  public static async hashBuffer(buffer: Buffer | ArrayBuffer): Promise<string> {
    const hash = createHash('sha256');
    if (buffer instanceof ArrayBuffer) {
      hash.update(Buffer.from(buffer));
    } else {
      hash.update(buffer);
    }
    return hash.digest('hex');
  }

  /**
   * Fast Hash strategy for large files:
   * Hashes first 1MB + middle 1MB + last 1MB + total size
   * Gives near-instant unique signature for multi-gigabyte video files.
   */
  public static async generateFastSignature(buffer: Buffer, fileSize: number): Promise<string> {
    const CHUNK_SIZE = 1024 * 1024; // 1MB

    if (fileSize <= CHUNK_SIZE * 3) {
      return this.hashBuffer(buffer);
    }

    const hash = createHash('sha256');
    
    // Head chunk (first 1MB)
    const head = buffer.subarray(0, CHUNK_SIZE);
    hash.update(head);

    // Mid chunk (middle 1MB)
    const midStart = Math.floor(fileSize / 2) - Math.floor(CHUNK_SIZE / 2);
    const mid = buffer.subarray(midStart, midStart + CHUNK_SIZE);
    hash.update(mid);

    // Tail chunk (last 1MB)
    const tail = buffer.subarray(fileSize - CHUNK_SIZE, fileSize);
    hash.update(tail);

    // Include exact byte size in hash digest
    hash.update(Buffer.from(fileSize.toString()));

    return hash.digest('hex');
  }
}
