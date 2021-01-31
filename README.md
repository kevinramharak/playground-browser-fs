## Playground Browser FS

The Playground Browser FS plugin provides an api on the global 'browserfs' for other plugins to consume. It uses a fork of [BrowserFS](https://github.com/kevinramharak/BrowserFS) to provide a custom build to provide a modern interface and helpers too interact with the playground.

## What it does

This plugin intialises [BrowserFS](https://github.com/jvilk/BrowserFS) with a [`MountableFileSystem`](https://jvilk.com/browserfs/2.0.0-beta/classes/_backend_mountablefilesystem_.mountablefilesystem.html). This allows other plugins to create and [mount](https://jvilk.com/browserfs/2.0.0-beta/classes/_backend_mountablefilesystem_.mountablefilesystem.html#mount) additional filesystems any given mount point. Using the `createSystem` and `createCompilerHost` factory functions will provide you with `ts.System` and `ts.CompilerHost` objects that can be used to invoke the typescript compiler using BrowserFS as file system.


## When would you use it
The playground is powered by [`TypeScript VFS`](https://github.com/microsoft/TypeScript-Website/tree/v2/packages/typescript-vfs) by default. This works great for single file cases and with a bit of knowledge of the source code implementing multiple file support is not that much extra work.

While `playground-browser-fs` is largely based on `tsvfs` it mimics a nodejs environment for the typescript compiler. For example `createSystem` and `createCompilerHost` both return a `ts.System` and `ts.CompilerHost` that will pretend the typescript compiler was installed like a package and resides in `node_modules/typescript`.

I haven't found an explicit use for this feature yet, but this goes nicely with `BrowserFS` shimming other nodejs internals.

> TODO: implement module resolution

Examples of plugins that use `playground-browser-fs`:
- *crickets*

Ideas that could be implemented:
- Compile a project consisting of multiple files and libraries
- File Explorer and the option to add multiple files
- implement `node_modules/` as a mirror to something like [`unpkg`](https://www.unpkg.com/) with the help of something like [`velcro`](https://github.com/ggoodman/velcro).

## Installation

### create a typescript playground plugin
If you do not have a plugin yet follow [these instructions](https://www.typescriptlang.org/dev/playground-plugins/).

### install the plugin as a dependency
```
yarn add playground-browser-fs
```

### install the BrowserFS fork as a dependency
```
# TODO: publish to npm
# TODO: drop this dependency as it is only used for .d.ts files
yarn add -D https://github.com/kevinramharak/BrowserFS
```

### configure rollup to treat 
```
// your config might look something like this:
export default rootFiles.map(name => {
  /** @type { import("rollup").RollupOptions } */
  const options = {
    input: `src/${name}`,
    external: ['typescript', 'playground-browser-fs'], // <-- add 'playground-browser-fs' to any exisiting externals
    output: {
      name,
      dir: 'dist',
      format: 'amd',
    },
    plugins: [typescript({ tsconfig: 'tsconfig.json' }), commonjs(), node(), json()],
  }
  return options
})
```

> NOTE: !!! do not bundle this plugin with your own plugin

## API

### importing the package vs using the global
The plugin is exposed as the named module `playground-browser-fs` and as the global `browserfs`.
Because of the async nature of the playground plugins the global might not be defined when you try to access it.
For this reason using `import { ... } from 'playground-browser-fs` is recommended.

### BrowserFS
BrowserFS provides an interface similar to the [`fs`](https://jvilk.com/browserfs/2.0.0-beta/interfaces/_core_fs_.fsmodule.html) module used in nodejs. In addition to the `fs` module BrowserFS provides the following shims with its `require` function:
- [`path`](https://github.com/jvilk/bfs-path)
- [`buffer`](https://github.com/jvilk/bfs-buffer)
- [`process`](https://github.com/jvilk/bfs-process)

> NOTE: Keep in mind that these are shims of the API's and they will not be exact replica's.

```ts
import { fs, path, buffer, Buffer, process }  from 'playground-browser-fs';
```

The BrowserFS module itself can be accessed by accessing the `browserfs.BrowserFS` property:
```ts
import { BrowserFS } from 'playground-browser-fs';
```

> It is recommended to use the `browserfs` api instead of the actual `BrowserFS` api whenever possible.

To make the BrowserFS easier to work with (and semi type safe) the following api is exposed:
```ts
import { createFileSystem, mountFileSystem, unmountFileSystem } from 'playground-browser-fs';
```

Those are defined with the following declarations:
```ts
// The FileSystemType maps to the backends at: https://jvilk.com/browserfs/2.0.0-beta/index.html#overview-of-backends
type FileSystemType = "AsyncMirror" | "FolderAdapter"| "InMemory" | "IndexedDB" | "LocalStorage" | "MountableFileSystem" | "WorkerFS" | "HTTPRequest" | "OverlayFS";

declare function createFileSystem<T extends FileSystemType>(config: FileSystemConfiguration<T>): Promise<FileSystem<T>>;

declare function mountFileSystem<T extends FileSystemType>(mountPoint: string, fs: FileSystem<T>): Promise<void>;

declare function unmountFileSystem(mountPoint: string): Promise<FileSystem<FileSystemType>>;
```

Create a [`ts.System`](https://basarat.gitbook.io/typescript/overview#file-system) and a [`ts.CompilerHost`](https://basarat.gitbook.io/typescript/overview/program#usage-of-compilerhost):
```ts
import ts from 'typescript'
import { createSystem, createCompilerHost, fs } from 'playground-browser-fs;
const { getCompilerOptions } = sandbox; // use the sandbox injected in your plugin

const compilerOptions = getCompilerOptions();
const system = createSystem(fs);
const host = createCompilerHost(system, compilerOptions, ts);
```

Check out the [type definitions](https://github.com/kevinramharak/BrowserFS/tree/master/index.d.ts/) or take a look at the [source code](https://github.com/kevinramharak/BrowserFS/tree/master/src/) if you need more insight in how it works.

## Running this plugin
- [Click this link](https://www.typescriptlang.org/play?install-plugin=playground-browser-fs)

or

- Open up the TypeScript Playground
- Go the "Plugins" in the sidebar
- Look for "Plugins from npm"
- Add "playground-browser-fs"
- Reload the browser

Then it will show up as a tab in the sidebar.
