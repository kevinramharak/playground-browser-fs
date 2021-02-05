/**
 * This file attempts to provide a better and more sound types for the BrowserFS package
 * @file
 */

import type browserfs from 'browserfs';

type BrowserFS = typeof browserfs;

/**
 * 
 */
export type FileSystemName = keyof BrowserFS['FileSystem'];

/**
 * 
 */
export type FileSystemConstructor<TName extends FileSystemName = FileSystemName> = BrowserFS['FileSystem'][TName];

// Because of private constructors we use:
// - type TClass = FileSystemConstructor['Create']
// - type TParams = Parameters<T>
// - type TCallback = TParams[1]
// - type TCallbackParams = Parameters<TCallback>
// - type TInstance = TCallbackParams[1]
/**
 */
export type FileSystem<TName extends FileSystemName = FileSystemName> = Exclude<Parameters<Parameters<FileSystemConstructor<TName>['Create']>[1]>[1], undefined>;

// we redo the Configuration because mapping the original types to something new is just to much of a pain

export interface AsyncMirrorConfiguration {
    /**
     * The synchronous file system to mirror the asynchronous file system to.
     * NOTE: the filesystem should support synchronisation `FileSystem.sypportsSynch()`
     */
    sync: FileSystem;
    /**
     * The asynchronous file system to mirror.
     */
    async: FileSystem;
}

export interface FolderAdapterConfiguration {
    /**
     * The folder to use as the root directory
     */
    folder: string;
    /**
     * The file system to wrap
     */
    wrapped: FileSystem;
}

export interface IndexedDBConfiguration {
    /**
     * The name of this file system. You can have multiple IndexedDB file systems operating at once, but each must have a different name.
     */
    storeName?: string;
    /**
     * The size of the inode cache. Defaults to 100. A size of 0 or below disables caching.
     */
    cacheSize?: number;
}

export interface MountableFileSystemConfiguration {
    [mountPoint: string]: FileSystem;
}

export type FileSystemConfigurationMap = {
    AsyncMirror: AsyncMirrorConfiguration,
    FolderAdapter: FolderAdapterConfiguration,
    IndexedDB: IndexedDBConfiguration,
    MountableFileSystem: MountableFileSystemConfiguration,
}

export type FileSystemConfiguration<TName extends FileSystemName = FileSystemName> = TName extends keyof FileSystemConfigurationMap ? FileSystemConfigurationMap[TName] : undefined;
