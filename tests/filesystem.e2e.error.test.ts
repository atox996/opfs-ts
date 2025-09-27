import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OPDir, OPFile } from "../src";

let rootDir: OPDir;

describe("FileSystem E2E - error and conflict scenarios", () => {
  beforeEach(async () => {
    rootDir = new OPDir("rootDirError");
    if (await rootDir.exists()) {
      await rootDir.remove();
    }
    await rootDir.create();
  });

  afterEach(async () => {
    if (await rootDir.exists()) {
      await rootDir.remove();
    }
  });

  it("should throw error when writing to closed file handle", async () => {
    const file = new OPFile("rootDirError/closedFile.txt");
    await file.create();
    const handle = await file.open({ mode: "readwrite" });
    await handle.close();

    await expect(handle.write(new Uint8Array([1]))).rejects.toBeDefined();
  });

  it("should throw error when reading from closed file handle", async () => {
    const file = new OPFile("rootDirError/closedFile2.txt");
    await file.create();
    const handle = await file.open({ mode: "readwrite" });
    await handle.close();

    await expect(handle.read(1)).rejects.toBeDefined();
  });

  it("should fail gracefully when truncating a closed file handle", async () => {
    const file = new OPFile("rootDirError/truncateFile.txt");
    await file.create();
    const handle = await file.open({ mode: "readwrite" });
    await handle.close();

    await expect(handle.truncate(5)).rejects.toBeDefined();
  });
});
