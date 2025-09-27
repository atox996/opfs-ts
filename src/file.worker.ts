import type {
  FileSystemSyncAccessHandle,
  WorkerActionsMap,
  WorkerRequest,
} from "./types";
import {
  bufferTransfer,
  collectTransferables,
  getFileSystemHandle,
} from "./utils";

const accessHandleMap = new Map<string, FileSystemSyncAccessHandle>();

const actions: WorkerActionsMap = {
  read: (ah, args) => {
    const readSize = ah.read(...args);
    return bufferTransfer(args[0], readSize);
  },
  write: (ah, args) => ah.write(...args),
  truncate: (ah, args) => ah.truncate(...args),
  flush: (ah) => ah.flush(),
  getSize: (ah) => ah.getSize(),
  close: (ah, _args, path) => {
    ah.close();
    if (path) accessHandleMap.delete(path);
  },
};

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const { id, action, path, args } = ev.data;

  try {
    let result;

    if (action === "open") {
      // open must be called first, handle separately
      const fh = await getFileSystemHandle(path, {
        create: true,
        isFile: true,
      });
      const handle = await fh.createSyncAccessHandle(...args);
      accessHandleMap.set(path, handle);
      result = undefined; // open returns void
    } else {
      const ah = accessHandleMap.get(path);
      if (!ah) throw new Error("Invalid access handle");

      const fn = actions[action];
      if (!fn) throw new Error(`Invalid action: ${action}`);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      result = fn(ah, args, path);
    }

    // Send response
    self.postMessage(
      { id, action, result },
      { transfer: collectTransferables(result) },
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    self.postMessage({
      id,
      action,
      error: { message: err.message, name: err.name },
    });
  }
};
