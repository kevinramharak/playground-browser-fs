import BrowserFSModule from 'browserfs';

const { BFSRequire, getFileSystem, initialize } = BrowserFSModule;

export type FileSystemType = keyof typeof BrowserFS.FileSystem;
export type FileSystemConstructor<T extends FileSystemType> = typeof BrowserFS['FileSystem'][T];
type FileSystemCreateCallbackParameters<T extends FileSystemType> = Parameters<Parameters<FileSystemConstructor<T>['Create']>[1]>;
export type FileSystem<T extends FileSystemType> = FileSystemCreateCallbackParameters<T>[1];

// TODO: fix the type mess that is BrowserFS
//export type ExactFileSystemConfiguration<T extends FileSystemType> = T extends 'InMemory' ? BaseFileSystemConfiguration<T> : Parameters<FileSystemConstructor<T>['Create']>[0];
export type BaseFileSystemConfiguration<T extends FileSystemType> = { fs: T, options?: any };
export type FileSystemConfiguration<T extends FileSystemType> = BaseFileSystemConfiguration<T>;

export interface Deferred<T> extends Promise<T> {
    resolve: (value: T) => void;
    reject: (reason: any) => void;
}

export function defer<T>() {
    let _resolve: (value: T) => void, _reject: (reason: any) => void;
    const promise = new Promise((resolve , reject) => { _resolve = resolve; _reject = reject; }) as Deferred<T>;
    promise.resolve = _resolve;
    promise.reject = _reject;
    return promise;
}

export const buffer = BFSRequire('buffer');
export const Buffer = buffer.Buffer as unknown as Buffer; // without this cast .d.ts generates typeof globalThis.Buffer
export const path = BFSRequire('path');
export const fs = BFSRequire('fs');
export const process = BFSRequire('process');
export const BrowserFS = BrowserFSModule;

/**
 * Configures BrowserFS to use the given file system.
 * @internal
 */
async function configureBrowserFS(config: FileSystemConfiguration<'MountableFileSystem'>) {
    return createFileSystem(config).then(fs => {
        return initialize(fs) as FileSystem<'MountableFileSystem'>;
    });
}

export const root = (window as any).root ? (window as any).root as Promise<FileSystem<'MountableFileSystem'>> : defer<FileSystem<'MountableFileSystem'>>();

if (!(fs as any).root) {
    configureBrowserFS({
        fs: 'MountableFileSystem',
        options: {},
    }).then(rootFs => (root as Deferred<FileSystem<'MountableFileSystem'>>).resolve(rootFs));
}

/**
 * Creates a new BrowserFS file system with the given type and config. See the BrowserFS documentation for the exact options.
 * Note that the resolved file system has not been mounted yet @see mountFileSystem
 */
export function createFileSystem<T extends FileSystemType>(config: FileSystemConfiguration<T>) {
    return new Promise<FileSystem<T>>((resolve, reject) => {
        getFileSystem(config, (error, fs) => {
            error ? reject(error) : resolve(fs as FileSystem<T>);
        });
    });
}

interface FileSystemMountedEvent<T extends FileSystemType> extends CustomEvent<FileSystem<T>> {
    name: 'FileSystemMounted';
}

interface FileSystemUnmountedEvent<T extends FileSystemType> extends CustomEvent<FileSystem<T>> {
    name: 'FileSystemUnmounted';
}

// TODO: implement an actual event system
/**
 * @internal
 */
export const listeners = {
    mounted: [],
    unmounted: [],
};

/**
 * Listen to mounted events, returns a deregister function
 */
export function onFileSystemMounted<T extends FileSystemType>(cb: (event: FileSystemMountedEvent<T>) => void) {
    if (listeners.mounted.indexOf(cb) === -1) {
        listeners.mounted.push(cb);
    }
    return () => {
        const index = listeners.mounted.indexOf(cb);
        if (index !== -1) {
            listeners.mounted.splice(index, 1);
        }
    };
}

/**
 * Listen to unmounted events, returns a deregister function
 */
export function onFileSystemUnmounted<T extends FileSystemType>(cb: (event: FileSystemUnmountedEvent<T>) => void) {
    if (listeners.unmounted.indexOf(cb) === -1) {
        listeners.unmounted.push(cb);
    }
    return () => {
        const index = listeners.unmounted.indexOf(cb);
        if (index !== -1) {
            listeners.unmounted.splice(index, 1);
        }
    };
}

export function emitFileSystemEvent<T extends FileSystemType>(type: 'mounted' | 'unmounted', detail: FileSystem<T>) {
    const name = {
        mounted: 'FileSystemMounted',
        unmounted: 'FileSystemUnmount',
    }[type];
    const event = new CustomEvent<FileSystem<T>>(name, { detail });
    listeners[type].forEach(listener => {
        BrowserFS.setImmediate(() => {
            listener(event);
        });
    });
}

/**
 * Mounts the given file system at the given mount point
 */
export async function mountFileSystem<T extends FileSystemType>(mountPoint: string, fs: FileSystem<T>) {
    const rootFs = await root;
    rootFs.mount(mountPoint, fs);
    emitFileSystemEvent('mounted', fs);
}

/**
 * Unmounts the file system at the given mount point and return it
 */
export async function unmountFileSystem(mountPoint: string) {
    const rootFs = await root;
    const mounted = rootFs._getFs(mountPoint);
    rootFs.umount(mountPoint);
    emitFileSystemEvent('unmounted', mounted.fs as any);
    return mounted.fs;
}
