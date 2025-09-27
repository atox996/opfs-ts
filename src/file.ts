import OPFS from "./opfs";
import { type FileAccess, openFile } from "./sync-file";
import type { FileSystemSyncAccessHandleOptions } from "./types";
import { getFileSystemHandle } from "./utils";

/**
 * Represents a file in OPFS (Origin Private File System).
 * Provides create, read, write, copy, move operations.
 *
 * @example
 * ```ts
 * import { file } from "opfs-ts";
 *
 * const myFile = file("/docs/example.txt");
 *
 * // Create
 * await myFile.create();
 *
 * // Write
 * const rw = await myFile.open({ mode: "readwrite" });
 * await rw.write("Hello OPFS!");
 * await rw.flush();
 * await rw.close();
 *
 * // Read
 * const ro = await myFile.open({ mode: "read-only" });
 * const buffer = await ro.read(1024);
 * await ro.close();
 *
 * // Move file
 * const destDir = await navigator.storage.getDirectory();
 * await myFile.moveTo(destDir);
 * ```
 */
class OPFile extends OPFS {
  /** File kind: always "file" */
  readonly kind = "file";

  /** Create the file if it does not exist. */
  async create(): Promise<FileSystemFileHandle> {
    return await getFileSystemHandle(this.fullPath, {
      create: true,
      isFile: true,
    });
  }

  /** Check whether the file exists. */
  async exists(): Promise<boolean> {
    return (
      (await getFileSystemHandle(this.fullPath, {
        create: false,
        isFile: true,
      })) !== null
    );
  }

  /** Remove the file. */
  async remove(): Promise<void> {
    const parentPath = this.parents.join("/");
    const parentHandle = await getFileSystemHandle(parentPath, {
      create: false,
      isFile: false,
    });
    if (!parentHandle)
      throw new DOMException(
        `Parent directory "${parentPath}" does not exist`,
        "NotFoundError",
      );
    await parentHandle.removeEntry(this.name);
  }

  /**
   * Copy the file to a destination directory, file handle, or OPFile.
   * @param dest - Destination
   */
  async copyTo(
    dest: FileSystemDirectoryHandle | FileSystemFileHandle | OPFS,
  ): Promise<void> {
    let targetFile: FileSystemFileHandle;
    if (dest instanceof FileSystemDirectoryHandle) {
      targetFile = await dest.getFileHandle(this.name, { create: true });
    } else if (dest instanceof FileSystemFileHandle) {
      targetFile = dest;
    } else if (dest.kind === "directory") {
      return this.copyTo(await dest.create());
    } else {
      targetFile = (await dest.create()) as FileSystemFileHandle;
    }
    await (await this.stream()).pipeTo(await targetFile.createWritable());
  }

  /**
   * Move the file to a destination directory, file handle, or OPFile.
   * @param dest - Destination
   */
  async moveTo(
    dest: FileSystemDirectoryHandle | FileSystemFileHandle | OPFS,
  ): Promise<void> {
    await this.copyTo(dest);
    await this.remove();
  }

  /**
   * Open the file for reading or writing.
   * @param options - File access mode
   * @returns `FileRO` if mode is "read-only", else `FileRW`
   */
  async open<T extends FileSystemSyncAccessHandleOptions>(
    options?: T,
  ): Promise<FileAccess<T["mode"]>> {
    return openFile(this.fullPath, options);
  }

  /** Read the file as text. */
  async text(): Promise<string> {
    return new TextDecoder().decode(await this.arrayBuffer());
  }

  /** Read the file as ArrayBuffer. */
  async arrayBuffer(): Promise<ArrayBuffer> {
    const file = await this.getFile();
    if (!file) throw new DOMException("File not found", "NotFoundError");
    return file.arrayBuffer();
  }

  /** Get a ReadableStream for the file content. */
  async stream(): Promise<ReadableStream<BufferSource>> {
    const file = await this.getFile();
    if (!file) throw new DOMException("File not found", "NotFoundError");
    return file.stream();
  }

  /** Get the underlying File object. */
  async getFile(): Promise<File | undefined> {
    return (
      await getFileSystemHandle(this.fullPath, { create: false, isFile: true })
    )?.getFile();
  }
}

/** Create an OPFile instance for the given path. */
function file(path: string): OPFile {
  return new OPFile(path);
}

export { file, OPFile };
