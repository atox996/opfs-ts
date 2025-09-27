import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OPDir, OPFile } from "../src";

let rootDir: OPDir;

describe("FileSystem E2E - combined file and directory operations", () => {
  beforeEach(async () => {
    rootDir = new OPDir("rootDir");
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

  it("should create nested structure, write files, and verify contents", async () => {
    const file1 = new OPFile("rootDir/sub1/file1.txt");
    const file2 = new OPFile("rootDir/sub2/file2.txt");
    await file1.create();
    await file2.create();

    const content1 = "Hello from file1";
    const content2 = "Hello from file2";

    const handle1 = await file1.open({ mode: "readwrite" });
    const handle2 = await file2.open({ mode: "readwrite" });

    await handle1.write(new TextEncoder().encode(content1));
    await handle2.write(new TextEncoder().encode(content2));

    await handle1.flush();
    await handle2.flush();

    await handle1.close();
    await handle2.close();

    expect(await file1.text()).toBe(content1);
    expect(await file2.text()).toBe(content2);
  });

  it("should copy entire root directory with nested files and verify", async () => {
    const file = new OPFile("rootDir/sub/file.txt");
    await file.create();
    const fh = await file.open({ mode: "readwrite" });
    await fh.write(new TextEncoder().encode("data"));
    await fh.close();

    const copyRoot = new OPDir("copyRoot");
    await copyRoot.remove();
    await rootDir.copyTo(copyRoot);
    expect(await copyRoot.exists()).toBe(true);

    const copiedFile = new OPFile("copyRoot/rootDir/sub/file.txt");
    expect(await copiedFile.exists()).toBe(true);
    expect(await copiedFile.text()).toBe("data");
  });

  it("should move nested directory and ensure original is gone", async () => {
    const subDir = new OPDir("rootDir/moveDir");
    await subDir.create();
    const file = new OPFile("rootDir/moveDir/file.txt");
    await file.create();
    const fh = await file.open({ mode: "readwrite" });
    await fh.write(new TextEncoder().encode("moveData"));
    await fh.flush();
    await fh.close();

    const movedRoot = new OPDir("movedRoot");
    await movedRoot.remove();
    await subDir.moveTo(movedRoot);

    expect(await movedRoot.exists()).toBe(true);
    const movedFile = new OPFile("movedRoot/moveDir/file.txt");
    expect(await movedFile.exists()).toBe(true);
    expect(await movedFile.text()).toBe("moveData");
    expect(await subDir.exists()).toBe(false);
  });

  it("should handle combination of multiple files and nested directories", async () => {
    const nestedDir = new OPDir("rootDir/nested");
    await nestedDir.create();

    const files = [
      new OPFile("rootDir/fileA.txt"),
      new OPFile("rootDir/nested/fileB.txt"),
    ];

    for (const [i, f] of files.entries()) {
      await f.create();
      const handle = await f.open({ mode: "readwrite" });
      await handle.write(new TextEncoder().encode(`content${i}`));
      await handle.flush();
      await handle.close();
    }

    expect(await files[0].text()).toBe("content0");
    expect(await files[1].text()).toBe("content1");

    const newDir = new OPDir("rootDir/newNested");
    await nestedDir.moveTo(newDir);
    expect(await newDir.exists()).toBe(true);
    expect(await nestedDir.exists()).toBe(false);
  });
});
