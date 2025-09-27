import { parsePath } from "./utils";

/**
 * Base class for OPFS file system objects (files and directories).
 * Provides common properties such as full path, name, and parent directories.
 *
 * @remarks
 * This class is abstract and should not be instantiated directly.
 * Use `OPFile` or `OPDir` for working with files and directories.
 *
 * @example
 * ```ts
 * import { file } from "opfs-ts";
 *
 * const myFile = file("/documents/report.txt");
 * await myFile.create();
 * console.log(myFile.fullPath); // "/documents/report.txt"
 * console.log(myFile.name);     // "report.txt"
 * console.log(myFile.parents);  // ["documents"]
 * ```
 */
export default abstract class OPFS {
  /** Type of the file system object: "file" or "directory" */
  abstract readonly kind: FileSystemHandleKind;

  /** Full path of the file system object */
  readonly fullPath: string;

  /** Name of the file or directory */
  readonly name: string;

  /** Parent directories as an array of strings */
  readonly parents: string[];

  constructor(path: string) {
    const { fullPath, name, parents } = parsePath(path);
    this.fullPath = fullPath;
    this.name = name || "";
    this.parents = parents;
  }

  /**
   * Create the file or directory in OPFS.
   *
   * @returns The underlying `FileSystemDirectoryHandle` or `FileSystemFileHandle`.
   */
  abstract create(): Promise<FileSystemDirectoryHandle | FileSystemFileHandle>;

  /**
   * Check if the file or directory exists.
   *
   * @returns `true` if the object exists, `false` otherwise.
   */
  abstract exists(): Promise<boolean>;

  /**
   * Remove the file or directory.
   *
   * @remarks
   * Directories may need recursive removal of all children.
   */
  abstract remove(): Promise<void>;
}
