import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OPDir } from "../src";

let testDir: OPDir;

describe("OPDir - edge cases", () => {
  beforeEach(async () => {
    testDir = new OPDir("testDir");
    if (await testDir.exists()) {
      await testDir.remove();
    }
  });

  afterEach(async () => {
    if (await testDir.exists()) {
      await testDir.remove();
    }
  });

  it("should handle empty directory correctly", async () => {
    await testDir.create();
    const children = await testDir.children();
    expect(children.length).toBe(0);
  });

  it("should copy and move nested directory structure", async () => {
    await testDir.create();
    const subDir = new OPDir("subDir");
    await subDir.create();
    await subDir.moveTo(testDir);
    const children = await testDir.children();
    expect(children.length).toBe(1);
    expect(children[0].name).toBe("subDir");

    const moveDir = new OPDir("moveDir");
    await moveDir.create();
    await testDir.moveTo(moveDir);
    expect(await moveDir.exists()).toBe(true);
    expect(await testDir.exists()).toBe(false);

    await subDir.remove();
  });
});
