import type { FileSystemFileHandleNew } from "./types";

export function parsePath(path: string): {
  fullPath: string;
  name?: string;
  parents: string[];
} {
  const segments = path.split("/").filter(Boolean);
  return {
    fullPath: `/${segments.join("/")}`,
    name: segments.pop(),
    parents: segments,
  };
}

export function getFileSystemHandle(
  path: string,
  options: {
    create?: false;
    isFile: true;
  },
): Promise<FileSystemFileHandleNew | null>;
export function getFileSystemHandle(
  path: string,
  options: {
    create: true;
    isFile: true;
  },
): Promise<FileSystemFileHandleNew>;
export function getFileSystemHandle(
  path: string,
  options?: {
    create?: false;
    isFile?: false;
  },
): Promise<FileSystemDirectoryHandle | null>;
export function getFileSystemHandle(
  path: string,
  options: {
    create: true;
    isFile?: false;
  },
): Promise<FileSystemDirectoryHandle>;
export async function getFileSystemHandle(
  path: string,
  options?: {
    create?: boolean;
    isFile?: boolean;
  },
) {
  const { name, parents } = parsePath(path);
  let root = await navigator.storage.getDirectory();
  if (!name) return options?.isFile ? null : root;
  try {
    for (const parent of parents) {
      root = await root.getDirectoryHandle(parent, { create: options?.create });
    }
    if (options?.isFile) {
      return await root.getFileHandle(name, { create: options?.create });
    }
    return await root.getDirectoryHandle(name, { create: options?.create });
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null;
    }
    throw error;
  }
}

export const createGenerateUniqueId = (): (() => string) => {
  if (typeof crypto?.randomUUID === "function") {
    return () => crypto.randomUUID();
  }
  return () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const uuid: () => string = createGenerateUniqueId();

export const collectTransferables = (
  ...args: unknown[]
): Transferable[] | undefined => {
  const transfer: Transferable[] = [];
  for (const a of args) {
    if (a instanceof ArrayBuffer) transfer.push(a);
    else if (ArrayBuffer.isView(a)) transfer.push(a.buffer);
  }
  if (transfer.length) return transfer;
};

export async function createPromisePool<T>(
  tasks: readonly (() => Promise<T>)[],
  concurrency = 5,
): Promise<void> {
  // Create an iterator for sequentially fetching tasks
  const iterator = tasks[Symbol.iterator]();

  // Each "pool" function fetches tasks from the iterator and executes them
  async function poolTask() {
    for (;;) {
      const next = iterator.next();
      if (next.done) break;
      await next.value();
    }
  }

  // Create Promise pool according to concurrency number
  const pools = Array(Math.min(concurrency, tasks.length))
    .fill(0)
    .map(() => poolTask());

  await Promise.all(pools);
}

export const bufferTransfer = (
  buffer: BufferSource,
  newSize: number,
): ArrayBuffer => {
  if (buffer instanceof ArrayBuffer) {
    return buffer.transfer?.(newSize) ?? buffer.slice(0, newSize);
  }

  const buf = buffer.buffer as ArrayBuffer;

  return bufferTransfer(buf, newSize);
};
