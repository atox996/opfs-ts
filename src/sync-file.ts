import OPFileWorker from "./file.worker?worker&inline";
import type {
  Deferred,
  FileSystemSyncAccessHandleOptions,
  FileSystemSyncAccessMode,
  WorkerAction,
  WorkerActionArgs,
  WorkerActionResult,
  WorkerResponse,
} from "./types";
import { collectTransferables, uuid } from "./utils";

const createFileWorker = (): {
  open: (
    path: string,
    options?: FileSystemSyncAccessHandleOptions,
  ) => Promise<void>;
  send: <A extends WorkerAction>(
    action: A,
    path: string,
    ...args: WorkerActionArgs[A]
  ) => Promise<WorkerActionResult[A]>;
} => {
  let worker: Worker | null = null;
  let openCount = 0;

  const deferredMap = new Map<
    string,
    Deferred<WorkerActionResult[WorkerAction]>
  >();
  const send = <A extends WorkerAction>(
    action: A,
    path: string,
    ...args: WorkerActionArgs[A]
  ) => {
    if (!worker)
      throw new DOMException(
        "Worker is not initialized. Call open() first.",
        "InvalidStateError",
      );
    const id = uuid();
    const { promise, resolve, reject } =
      Promise.withResolvers<WorkerActionResult[WorkerAction]>();
    deferredMap.set(id, { resolve, reject });
    worker.postMessage(
      { id, action, path, args },
      {
        transfer: collectTransferables(...args),
      },
    );
    return promise as Promise<WorkerActionResult[A]>;
  };

  const open = async (
    path: string,
    options?: FileSystemSyncAccessHandleOptions,
  ): Promise<void> => {
    if (!worker) {
      worker = new OPFileWorker();
      worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
        const { id, action, result, error } = ev.data;
        const deferred = deferredMap.get(id);
        if (!deferred) {
          console.warn("[OPFile]", "No deferred found for id:", id);
          return;
        }
        deferredMap.delete(id);
        if (error)
          deferred.reject(new Error(`${error.name}: ${error.message}`));
        else deferred.resolve(result);

        if (action === "open") {
          openCount++;
        } else if (action === "close") {
          openCount--;
          if (openCount <= 0) {
            worker?.terminate();
            worker = null;
            openCount = 0;
            for (const [, deferred] of deferredMap) {
              deferred.reject(
                new DOMException("Worker terminated", "AbortError"),
              );
            }
            deferredMap.clear();
          }
        }
      };
      worker.onerror = (ev) => {
        for (const [, deferred] of deferredMap) deferred.reject(ev);
        deferredMap.clear();
      };
    }
    await send("open", path, options);
  };

  return { open, send };
};

const fileWorker = createFileWorker();

/**
 * Read-only file handle.
 * Provides methods for reading and querying file size.
 */
export class FileRO {
  constructor(readonly fullPath: string) {}

  private prevReadOffset = 0;

  /**
   * Read data from the file.
   * @param size - Number of bytes or a preallocated buffer.
   * @param options - Optional `at` offset to read from.
   * @returns A Promise resolving to an ArrayBuffer of read data.
   */
  async read(
    size: number | BufferSource,
    options?: { at?: number },
  ): Promise<ArrayBuffer> {
    const buffer = typeof size === "number" ? new Uint8Array(size) : size;
    const at = options?.at ?? this.prevReadOffset;
    const result = await fileWorker.send("read", this.fullPath, buffer, { at });
    this.prevReadOffset = at + result.byteLength;
    return result;
  }

  /** Get file size in bytes. */
  getSize(): Promise<number> {
    return fileWorker.send("getSize", this.fullPath);
  }

  /** Close the file handle. */
  async close(): Promise<void> {
    return fileWorker.send("close", this.fullPath);
  }
}

/**
 * Read-write file handle.
 * Extends FileRO with write and truncate capabilities.
 */
export class FileRW extends FileRO {
  private textEncoder = new TextEncoder();
  private prevWriteOffset = 0;

  /**
   * Write data to the file.
   * @param data - String or buffer to write.
   * @param options - Optional `at` offset to write at.
   * @returns Number of bytes written.
   */
  async write(
    data: string | BufferSource,
    options?: { at?: number },
  ): Promise<number> {
    const content =
      typeof data === "string" ? this.textEncoder.encode(data) : data;
    const at = options?.at ?? this.prevWriteOffset;
    const result = await fileWorker.send("write", this.fullPath, content, {
      at,
    });
    this.prevWriteOffset = at + result;
    return result;
  }

  /**
   * Truncate the file to a specified size.
   * @param newSize - New size of the file in bytes.
   */
  async truncate(newSize: number): Promise<void> {
    await fileWorker.send("truncate", this.fullPath, newSize);
    if (this.prevWriteOffset > newSize) this.prevWriteOffset = newSize;
  }

  /** Flush pending writes to the file. */
  flush(): Promise<void> {
    return fileWorker.send("flush", this.fullPath);
  }
}

export type FileAccess<M extends FileSystemSyncAccessMode | undefined> =
  M extends "read-only" ? FileRO : FileRW;

export async function openFile<T extends FileSystemSyncAccessHandleOptions>(
  path: string,
  options?: T,
): Promise<FileAccess<T["mode"]>> {
  await fileWorker.open(path, options);
  if (options?.mode === "read-only")
    return new FileRO(path) as FileAccess<T["mode"]>;
  return new FileRW(path);
}
