import { file, OPFile } from "./file";
import OPFS from "./opfs";
import { createPromisePool, getFileSystemHandle } from "./utils";

/**
 * Represents a directory in the OPFS (Origin Private File System).
 * Provides methods to create, query, enumerate, copy, move, and remove directories.
 *
 * @example
 * ```ts
 * import { dir } from "opfs-ts";
 *
 * const myDir = dir("/documents");
 * await myDir.create();
 *
 * // List children
 * const children = await myDir.children();
 * children.forEach(child => console.log(child.fullPath));
 *
 * // Copy directory
 * const destDirHandle = await navigator.storage.getDirectory();
 * await myDir.copyTo(destDirHandle);
 *
 * // Remove directory
 * await myDir.remove();
 * ```
 */
class OPDir extends OPFS {
  /** Directory kind: always `"directory"` */
  readonly kind = "directory";

  /**
   * Create the directory in OPFS. If it already exists, does nothing.
   *
   * @returns The underlying `FileSystemDirectoryHandle`.
   */
  async create(): Promise<FileSystemDirectoryHandle> {
    return await getFileSystemHandle(this.fullPath, {
      create: true,
      isFile: false,
    });
  }

  /**
   * Checks if the directory exists.
   *
   * @returns `true` if the directory exists, `false` otherwise.
   */
  async exists(): Promise<boolean> {
    return (
      (await getFileSystemHandle(this.fullPath, {
        create: false,
        isFile: false,
      })) !== null
    );
  }

  /**
   * Lists the immediate children of this directory.
   *
   * @returns An array of `OPFile` and `OPDir` instances representing the children.
   */
  async children(): Promise<(OPDir | OPFile)[]> {
    const children: (OPDir | OPFile)[] = [];
    const handle = await getFileSystemHandle(this.fullPath, {
      create: false,
      isFile: false,
    });
    if (!handle) return children;
    for await (const item of handle.values()) {
      const path = `${this.fullPath}/${item.name}`;
      if (item.kind === "file") {
        children.push(file(path));
      } else {
        children.push(dir(path));
      }
    }
    return children;
  }

  /**
   * Remove the directory.
   *
   * - If this is the root directory (no name), all its entries will be removed.
   * - Otherwise, removes this directory from its parent.
   *
   * @remarks Uses a concurrency pool to efficiently delete multiple entries.
   */
  async remove(): Promise<void> {
    const dirHandle = await getFileSystemHandle(this.fullPath, {
      create: false,
      isFile: false,
    });
    if (!dirHandle) return;

    // root directory
    if (!this.name) {
      const tasks: (() => Promise<void>)[] = [];
      for await (const itemName of dirHandle.keys()) {
        tasks.push(() => dirHandle.removeEntry(itemName, { recursive: true }));
      }
      await createPromisePool(tasks, 10); // concurrency pool
      return;
    }

    const parentHandle = await getFileSystemHandle(this.parents.join("/"), {
      create: false,
      isFile: false,
    });
    if (!parentHandle) return;
    await parentHandle.removeEntry(this.name, { recursive: true });
  }

  /**
   * Copy this directory and its contents to a destination directory.
   *
   * @param dest - Destination directory handle or OPDir instance.
   */
  async copyTo(dest: FileSystemDirectoryHandle | OPDir): Promise<void> {
    const children = await this.children();
    let tasks: (() => Promise<void>)[] = [];
    if (dest instanceof FileSystemDirectoryHandle) {
      tasks = children.map((child) => {
        if (child.kind === "file") {
          return async () =>
            child.copyTo(
              await dest.getFileHandle(child.name, { create: true }),
            );
        }
        return async () =>
          child.copyTo(
            await dest.getDirectoryHandle(child.name, { create: true }),
          );
      });
    } else {
      const destDir = dir(`${dest.fullPath}/${this.name}`);
      await destDir.create();
      tasks = children.map((child) => () => child.copyTo(destDir));
    }
    await createPromisePool(tasks, 5);
  }

  /**
   * Move this directory to a destination.
   *
   * @param dest - Destination directory handle or OPDir instance.
   */
  async moveTo(dest: FileSystemDirectoryHandle | OPDir): Promise<void> {
    await this.copyTo(dest);
    await this.remove();
  }
}

/**
 * Create an `OPDir` instance for a given path.
 *
 * @param path - Absolute OPFS directory path (e.g., "/documents").
 * @returns `OPDir` instance.
 *
 * @example
 * ```ts
 * import { dir } from "opfs-ts";
 * const myDir = dir("/documents");
 * await myDir.create();
 * ```
 */
function dir(path: string): OPDir {
  return new OPDir(path);
}

export { dir, OPDir };
