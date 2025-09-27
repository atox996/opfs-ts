# opfs-ts

<p align="center">
<a href="https://www.npmjs.com/package/opfs-ts"><img src="https://img.shields.io/npm/v/opfs-ts" alt="NPM Version"></a>
<a href="https://www.npmjs.com/package/opfs-ts"><img src="https://img.shields.io/bundlephobia/minzip/opfs-ts" alt="Package Size"></a>
<br>
<a href="https://github.com/atox996/opfs-ts"><img src="https://img.shields.io/github/stars/atox996/opfs-ts" alt="GitHub Stars"></a>
</p>

**opfs-ts** is a modern JavaScript/TypeScript wrapper for the browser's native OPFS (Origin Private File System), providing a clean, user-friendly, and feature-rich API for working with the browser's private file system.

## Features

- 🔄 **Fully Asynchronous API** - Based on Promises and async/await
- 📁 **Complete File System Operations** - Create, read, write, copy, move, and delete files and directories
- 🔒 **Synchronized File Access** - Efficient synchronous file operations through Web Workers
- 📝 **Streaming File Processing** - Support for streaming large files
- 🔍 **TypeScript Support** - Full type definitions and type checking
- ⚡ **High Performance** - Concurrent operations using Promise pools
- 🧩 **Modular Design** - Easy to extend and integrate

## Installation

Install using npm, yarn, or pnpm:

```bash
# Using npm
npm install opfs-ts

# Using yarn
yarn add opfs-ts

# Using pnpm
pnpm add opfs-ts
```

## Basic Usage

### File Operations

```javascript
import { file } from "opfs-ts";

// Create or open a file
const myFile = file("/documents/report.txt");
await myFile.create();

// Write content to the file
const rw = await myFile.open({ mode: "readwrite" });
await rw.write("Hello, OPFS!");
await rw.flush();
await rw.close();

// Read file content
const fileContent = await myFile.text();
console.log(fileContent); // 'Hello, OPFS!'

// Read as binary data
const buffer = await myFile.arrayBuffer();

// Delete the file
await myFile.remove();
```

### Directory Operations

```javascript
import { dir } from "opfs-ts";

// Create or open a directory
const myDir = dir("/documents/work");
await myDir.create();

// List directory contents
const children = await myDir.children();
children.forEach((child) => {
  console.log(`${child.kind}: ${child.fullPath}`);
});

// Copy directory
const destDir = dir("/backup");
await destDir.create();
await myDir.copyTo(destDir);

// Delete directory
await myDir.remove();
```

### File System Object Properties

Every file system object (file or directory) has the following properties:

```javascript
const myFile = file("/documents/report.txt");
console.log(myFile.fullPath); // '/documents/report.txt'
console.log(myFile.name); // 'report.txt'
console.log(myFile.parents); // ['documents']
console.log(myFile.kind); // 'file' (or 'directory')
```

### Advanced File Operations

```javascript
import { file } from "opfs-ts";

const largeFile = file("/data/large.bin");
await largeFile.create();

// Write large data
const rw = await largeFile.open();
// Write at specific offset
await rw.write(new Uint8Array([1, 2, 3, 4, 5]), { at: 100 });
// Truncate file
await rw.truncate(1024 * 1024); // 1MB
await rw.close();

// Read as stream
const stream = await largeFile.stream();
const reader = stream.getReader();
// Read stream data...

// Check if file exists
const exists = await largeFile.exists();

// Move file
const newLocation = dir("/archive");
await newLocation.create();
await largeFile.moveTo(newLocation);
```

## API Documentation

Full API documentation is available at [https://atox996.github.io/opfs-ts/](https://atox996.github.io/opfs-ts/).

### Core API

- **file(path: string): OPFile** - Creates a file operation object
- **dir(path: string): OPDir** - Creates a directory operation object

### OPFile Class

- `create(): Promise<FileSystemFileHandle>` - Creates the file
- `exists(): Promise<boolean>` - Checks if the file exists
- `remove(): Promise<void>` - Deletes the file
- `copyTo(dest): Promise<void>` - Copies the file to the destination
- `moveTo(dest): Promise<void>` - Moves the file to the destination
- `open(options?): Promise<FileRO | FileRW>` - Opens the file to get an access handle
- `text(): Promise<string>` - Reads the file content as text
- `arrayBuffer(): Promise<ArrayBuffer>` - Reads the file content as binary data
- `stream(): Promise<ReadableStream<BufferSource>>` - Gets a readable stream for the file
- `getFile(): Promise<File | undefined>` - Gets the underlying File object

### OPDir Class

- `create(): Promise<FileSystemDirectoryHandle>` - Creates the directory
- `exists(): Promise<boolean>` - Checks if the directory exists
- `remove(): Promise<void>` - Deletes the directory and its contents
- `children(): Promise<(OPDir | OPFile)[]>` - Lists the immediate children of the directory
- `copyTo(dest): Promise<void>` - Copies the directory and its contents to the destination
- `moveTo(dest): Promise<void>` - Moves the directory and its contents to the destination

### FileRO Class (Read-only File Handle)

- `read(size, options?): Promise<ArrayBuffer>` - Reads data from the file
- `getSize(): Promise<number>` - Gets the file size
- `close(): Promise<void>` - Closes the file handle

### FileRW Class (Read-write File Handle)

Extends FileRO with these additional methods:

- `write(data, options?): Promise<number>` - Writes data to the file
- `truncate(newSize): Promise<void>` - Truncates the file to the specified size
- `flush(): Promise<void>` - Flushes pending writes to storage

## Browser Support

This library requires browsers that support:

- Origin Private File System (OPFS)
- Web Workers
- ReadableStream

### Supported Browsers

- Chrome 121+ (createSyncAccessHandle with full mode option support)
- Edge 121+ (createSyncAccessHandle with full mode option support)
- Firefox 111+ (createSyncAccessHandle supported, but mode parameter not yet available)
- Safari 15.2+ (createSyncAccessHandle supported, but mode parameter not yet available)

## Development

If you want to contribute to this project, follow these steps:

1. Clone the repository

```bash
git clone https://github.com/atox996/opfs-ts.git
cd opfs-ts
```

2. Install dependencies

```bash
pnpm install
```

3. Start the development server

```bash
pnpm dev
```

4. Build the project

```bash
pnpm build
```

5. Run code checks

```bash
pnpm lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please submit Issues and Pull Requests to help improve this project. Before submitting, ensure your code adheres to the project's coding style and quality requirements.

## Acknowledgements

This project is built on top of the browser's native [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) API, aiming to provide a cleaner, more user-friendly interface for working with the browser's private file system.

## Related Links

- [MDN Web Docs: Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [W3C File System Access API Specification](https://wicg.github.io/file-system-access/)
