// ------------------ Worker Types ------------------
export type WorkerAction =
  | "open"
  | "read"
  | "write"
  | "getSize"
  | "truncate"
  | "flush"
  | "close";

export interface WorkerActionArgs {
  open: [options?: FileSystemSyncAccessHandleOptions];
  read: [buffer: BufferSource, options?: { at?: number }];
  write: [buffer: BufferSource, options?: { at?: number }];
  truncate: [newSize: number];
  flush: [];
  getSize: [];
  close: [];
}

export interface WorkerActionResult {
  open: void;
  read: ArrayBuffer;
  write: number;
  truncate: void;
  flush: void;
  getSize: number;
  close: void;
}

// ------------------ Worker Request / Response ------------------
export type WorkerRequest = {
  [A in WorkerAction]: {
    id: string;
    action: A;
    path: string;
    args: WorkerActionArgs[A];
  };
}[WorkerAction];

export type WorkerResponse = {
  [A in WorkerAction]: {
    id: string;
    action: A;
    result?: WorkerActionResult[A];
    error?: { message: string; name: string };
  };
}[WorkerAction];

// ------------------ Actions mapping types ------------------
export type WorkerActionsMap = {
  [A in Exclude<WorkerAction, "open">]: (
    ah: FileSystemSyncAccessHandle,
    args: WorkerActionArgs[A],
    path?: string,
  ) => WorkerActionResult[A];
};

// Optional Deferred type (if used)
export type Deferred<T> = Pick<PromiseWithResolvers<T>, "resolve" | "reject">;

/**
 * Synchronous access mode types
 */
export type FileSystemSyncAccessMode =
  | "read-only"
  | "readwrite"
  | "readwrite-unsafe";

/**
 * Parameter types for createSyncAccessHandle
 */
export interface FileSystemSyncAccessHandleOptions {
  /** Lock mode, defaults to "readwrite" */
  mode?: FileSystemSyncAccessMode;
}

/**
 * Represents a synchronous access file handle that provides high-performance read/write operations.
 */
export interface FileSystemSyncAccessHandle {
  /**
   * Read content from the file into the specified buffer.
   *
   * @param buffer Buffer for storing data (BufferSource, such as Uint8Array, DataView, etc.).
   *               Note: Cannot directly operate on ArrayBuffer, should access through typed arrays.
   * @param options Optional object:
   *   - at: number, start reading from the specified byte offset in the file
   * @returns Number of bytes actually read
   * @throws InvalidStateError If the access handle is already closed
   * @throws TypeError If the underlying file system does not support reading from the specified offset
   */
  read(buffer: BufferSource, options?: { at?: number }): number;

  /**
   * Write data from the specified buffer to the file.
   *
   * @param buffer Data to be written to the file (BufferSource, such as Uint8Array, DataView, etc.)
   * @param options Optional object:
   *   - at: number, start writing from the specified byte offset in the file
   * @returns Number of bytes actually written
   * @throws InvalidStateError If the access handle is already closed or file data modification fails
   * @throws QuotaExceededError If writing exceeds browser storage quota
   * @throws TypeError If the underlying file system does not support writing to the specified offset
   */
  write(buffer: BufferSource, options?: { at?: number }): number;

  /**
   * Get the byte size of the file.
   *
   * @returns File byte size
   * @throws InvalidStateError If the access handle is already closed
   */
  getSize(): number;

  /**
   * Truncate or extend the file to the specified size.
   *
   * @param newSize Adjusted byte size of the file
   * @returns void
   * @throws InvalidStateError If the access handle is already closed or file modification fails
   * @throws QuotaExceededError If newSize exceeds browser storage quota
   * @throws TypeError If the underlying file system does not support adjusting file size
   */
  truncate(newSize: number): void;

  /**
   * Persist the contents of the write buffer to storage.
   *
   * @returns void
   * @throws InvalidStateError If the access handle is already closed
   */
  flush(): void;

  /**
   * Close the handle and release lock resources.
   *
   * @returns void
   */
  close(): void;
}

/**
 * File handle object, extends FileSystemFileHandle.
 */
export interface FileSystemFileHandleNew extends FileSystemFileHandle {
  /**
   * Create a synchronous access handle (FileSystemSyncAccessHandle).
   *
   * @param options Optional object:
   *   - mode: Synchronous access lock mode, defaults to "readwrite"
   *       - "read-only": Read-only mode, multiple handles can be opened, can only call read(), getSize(), close() and other methods
   *       - "readwrite": Exclusive read-write mode, only one handle can exist per file at the same time
   *       - "readwrite-unsafe": Non-exclusive read-write mode, multiple handles can be opened, but writes may be inconsistent
   * @returns Returns synchronous access handle
   * @throws NotAllowedError If permission is not granted for readwrite mode
   * @throws InvalidStateError If the handle is not in the origin private file system
   * @throws NotFoundError If the file is not found
   * @throws NoModificationAllowedError If attempting to open multiple handles simultaneously in readwrite mode
   */
  createSyncAccessHandle(
    options?: FileSystemSyncAccessHandleOptions,
  ): Promise<FileSystemSyncAccessHandle>;
}
