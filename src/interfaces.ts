import * as fs from 'fs'

export interface FileSystem {
  chmodSync(path: fs.PathLike, mode: fs.Mode): void;
  readFileSync(path: fs.PathLike | number, options?: { encoding?: null; flag?: string; } | null): Buffer;
}
