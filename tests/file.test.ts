import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OPFile } from "../src";

let testFile: OPFile;

describe("OPFile - edge cases", () => {
  beforeEach(async () => {
    testFile = new OPFile("test.txt");
    if (await testFile.exists()) {
      await testFile.remove();
    }
  });

  afterEach(async () => {
    if (await testFile.exists()) {
      await testFile.remove();
    }
  });

  it("should handle zero-byte writes and reads", async () => {
    await testFile.create();
    const handle = await testFile.open({ mode: "readwrite" });

    const zeroData = new Uint8Array(0);
    const written = await handle.write(zeroData);
    expect(written).toBe(0);

    const readData = await handle.read(0);
    expect(readData.byteLength).toBe(0);

    await handle.close();
  });

  it("should handle truncate larger than file size", async () => {
    await testFile.create();
    const handle = await testFile.open({ mode: "readwrite" });
    const content = new TextEncoder().encode("abc");
    await handle.write(content);

    await handle.truncate(10);
    expect(await handle.getSize()).toBe(10);

    await handle.close();
  });

  it("should read text, arrayBuffer, and stream correctly after partial write", async () => {
    await testFile.create();
    const handle = await testFile.open({ mode: "readwrite" });
    const content = "12345";
    await handle.write(new TextEncoder().encode(content));
    await handle.flush();
    await handle.close();

    expect(await testFile.text()).toBe(content);
    expect(new TextDecoder().decode(await testFile.arrayBuffer())).toBe(
      content,
    );

    const stream = await testFile.stream();
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it("should close handle properly and throw if reused", async () => {
    await testFile.create();
    const handle = await testFile.open({ mode: "readwrite" });
    await handle.close();

    await expect(handle.write(new Uint8Array([1]))).rejects.toBeDefined();
    await expect(handle.read(1)).rejects.toBeDefined();
  });
});
