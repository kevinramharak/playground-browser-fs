import bfs from 'browserfs';
import type { FSModule } from 'browserfs/dist/node/core/FS';

import { createSystem, createCompilerHost } from '../playgroundbfs';

export type FileSystemType = keyof typeof bfs.FileSystem;
export type FileSystemConstructor<T extends FileSystemType> = typeof bfs['FileSystem'][T];
type FileSystemCreateCallbackParameters<T extends FileSystemType> = Parameters<Parameters<FileSystemConstructor<T>['Create']>[1]>;
export type FileSystem<T extends FileSystemType> = FileSystemCreateCallbackParameters<T>[1];
export type BaseFileSystemConfiguration<T extends FileSystemType> = { fs: T, options?: any };
export type ExactFileSystemConfiguration<T extends FileSystemType> = T extends 'InMemory' ? BaseFileSystemConfiguration<T> : Parameters<FileSystemConstructor<T>['Create']>[0];
export type FileSystemConfiguration<T extends FileSystemType> = BaseFileSystemConfiguration<T> & { options?: ExactFileSystemConfiguration<T> };

export interface BrowserFSHost {
    buffer: typeof import('buffer'),
    Buffer: typeof import('buffer').Buffer,
    path: typeof import('path'),
    fs: FSModule,
    root: FileSystem<'MountableFileSystem'>,
    process: typeof import('process'),
    require: typeof bfs.BFSRequire;
    ts: {
        createSystem: typeof createSystem,
        createCompilerHost: typeof createCompilerHost,
    },
    BrowserFS: typeof bfs,
    createFileSystem: typeof createFileSystem,
}

/**
 * Configures BrowserFS to use the given file system. This will be run by the plugin.
 * @internal
 */
export function installBrowserFS(host: Record<string, any> = {}): typeof host & BrowserFSHost {
    bfs.install(host);
    const _global = host as typeof host & BrowserFSHost;
    _global.buffer = _global.require('buffer');
    _global.path = _global.require('path');
    _global.fs = _global.require('fs');
    _global.ts = {
        createSystem,
        createCompilerHost,
    };
    _global.BrowserFS = bfs;
    _global.createFileSystem = createFileSystem;
    return _global as typeof host & BrowserFSHost;
}

/**
 * Configures BrowserFS to use the given file system. This will be run by the plugin.
 * @internal
 */
export function configureBrowserFS<T extends FileSystemType>(config: FileSystemConfiguration<T>) {
    return createFileSystem(config).then(fs => {
        browserfs.root = bfs.initialize(fs) as FileSystem<'MountableFileSystem'>;
    });
}

export function createFileSystem<T extends FileSystemType>(config: FileSystemConfiguration<T>) {
    return new Promise<FileSystem<T>>((resolve, reject) => {
        bfs.FileSystem[config.fs].Create(config, (error: any, fs: any) => {
            error ? reject(error) : resolve(fs);
        });
    });
}
