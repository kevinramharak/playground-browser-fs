import bfs from 'browserfs';

import { createSystem, createCompilerHost } from '../playgroundbfs';

export type FileSystemType = keyof typeof bfs.FileSystem;
export type FileSystemConstructor<T extends FileSystemType> = typeof bfs['FileSystem'][T];
type FileSystemCreateCallbackParameters<T extends FileSystemType> = Parameters<Parameters<FileSystemConstructor<T>['Create']>[1]>;
export type FileSystem<T extends FileSystemType> = FileSystemCreateCallbackParameters<T>[1];
export type BaseFileSystemConfiguration<T extends FileSystemType> = { fs: T, options?: any };
export type ExactFileSystemConfiguration<T extends FileSystemType> = T extends 'InMemory' ? BaseFileSystemConfiguration<T> : Parameters<FileSystemConstructor<T>['Create']>[0];
export type FileSystemConfiguration<T extends FileSystemType> = BaseFileSystemConfiguration<T> & ExactFileSystemConfiguration<T>;

export interface BrowserFSHost {
    buffer: typeof import('buffer');
    Buffer: typeof import('buffer').Buffer;
    path: typeof import('path');
    process: typeof import('process');
    require: typeof bfs.BFSRequire;
    ts: {
        createSystem: typeof createSystem,
        createCompilerHost: typeof createCompilerHost,
    },
}

// TODO: promisify fs

export function installBrowserFS(host: Record<string, any> = {}): typeof host & BrowserFSHost {
    bfs.install(host);
    const _global = host as typeof host & BrowserFSHost;
    _global.buffer = _global.require('buffer');
    _global.path = _global.require('path');
    _global.ts = {
        createSystem,
        createCompilerHost,
    };
    return _global as typeof host & BrowserFSHost;
}

export function configureBrowserFS<T extends FileSystemType>(config: FileSystemConfiguration<T>) {
    return new Promise<void>((resolve, reject) => {
        bfs.configure(config, (error) => {
            error ? reject(error) : resolve();
        });
    });
}

export function createFileSystem<T extends FileSystemType>(config: FileSystemConfiguration<T>) {
    return new Promise<FileSystem<T>>((resolve, reject) => {
        bfs.FileSystem[config.fs].Create(config, (error: any, fs: any) => {
            error ? reject(error) : resolve(fs);
        });
    });
}
