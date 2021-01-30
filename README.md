## Playground Browser FS

The Playground Browser FS plugin provides an api on the global 'browserfs' for other plugins to consume. It uses a fork of [BrowserFS](https://github.com/kevinramharak/BrowserFS) to provide a custom build to provide a modern interface and helpers too interact with the playground.

## API

This plugin intialises [BrowserFS](https://github.com/jvilk/BrowserFS) with a [`MountableFileSystem`](https://jvilk.com/browserfs/2.0.0-beta/classes/_backend_mountablefilesystem_.mountablefilesystem.html). This allows other plugins to create and [mount](https://jvilk.com/browserfs/2.0.0-beta/classes/_backend_mountablefilesystem_.mountablefilesystem.html#mount) additional filesystems any given mount point.

BrowserFS provides an interface similar to the [`fs`](https://jvilk.com/browserfs/2.0.0-beta/interfaces/_core_fs_.fsmodule.html) module used in nodejs. In addition to the `fs` module BrowserFS provides the following shims with its `require` function:
- [`path`](https://github.com/jvilk/bfs-path)
- [`buffer`](https://github.com/jvilk/bfs-buffer)
- [`process`](https://github.com/jvilk/bfs-process)

> NOTE: Keep in mind that these are shims of the API's and they can differ in various ways.

You can find these API's on the global `browserfs` like:
```ts
const { fs, require, path, buffer, Buffer, process } = browserfs;
```

The BrowserFS module can be accessed by accessing the `browserfs.BrowserFS` property like:
```ts
const { BrowserFS } = browserfs;
```

To make the BrowserFS easier to work with (and type safe) the following api is exposed:
```ts
const { createFileSystem } = browserfs;
```

With the [declaration](https://github.com/kevinramharak/BrowserFS/tree/master/typings/):
```ts
// The FileSystemType maps to the backends at: https://jvilk.com/browserfs/2.0.0-beta/index.html#overview-of-backends

type FileSystemType = "AsyncMirror" | "InMemory" | "IndexedDB" | "MountableFileSystem" | "HTTPRequest"

declare function createFileSystem<T extends FileSystemType>(config: FileSystemConfiguration<T>): Promise<FileSystem<T>>;
```

Create a [`ts.System`](https://basarat.gitbook.io/typescript/overview#file-system) like:
```ts
const { ts, fs } = browserfs;

const system = ts.createSystem(fs);
```

Create a [`ts.CompilerHost`](https://basarat.gitbook.io/typescript/overview/program#usage-of-compilerhost) like:
```ts
const { ts, fs } = browserfs;

const system = ts.createSystem(fs);
const host = ts.createCompilerHost(system: ts.System, compilerOptions: ts.CompilerOptions, ts: TS);
```

Check out the [type definitions](https://github.com/kevinramharak/BrowserFS/tree/master/typings/) or take a look at the [source code](https://github.com/kevinramharak/BrowserFS/tree/master/src/) if you need more information.

## Running this plugin

- [Click this link](https://www.staging-typescript.org/play?install-plugin=[playground-browser-fs])

or

- Open up the TypeScript Playground
- Go the "Plugins" in the sidebar
- Look for "Plugins from npm"
- Add "[playground-browser-fs]"
- Reload the browser

Then it will show up as a tab in the sidebar.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full details, however, TLDR:

```sh
git clone ...
yarn install
yarn start
```

*NOTE: the BrowserFS package is currently referenced as a github repo*

Then tick the box for starting plugin development inside the TypeScript Playground.
