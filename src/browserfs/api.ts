import BrowserFS from 'browserfs';
import { emit } from './eventify';
import type { FileSystem, FileSystemConfiguration, FileSystemName } from './types';

const { FileSystem: Backends, BFSRequire, initialize } = BrowserFS;
const fs = BFSRequire('fs');

/**
 * Creates a new BrowserFS file system with the given type and config. See the BrowserFS documentation for the exact options.
 * TODO: fix types
 */
export function createFileSystem<TName extends FileSystemName>(name: TName, config: FileSystemConfiguration<TName>): Promise<FileSystem<TName>> {
    return new Promise<FileSystem<TName>>((resolve, reject) => {
        const constructor = Backends[name];
        constructor.Create(config,
            ((error?: Error | null, fs?: FileSystem<TName>) =>{
                if (error) {
                    reject(error!);
                } else {
                    resolve(fs!);
                }
            }) as any, // annoying type error from inside browserfs
        );
    });
}


const rootFs = fs.getRootFS() as FileSystem<'MountableFileSystem'> | null;

/**
 * A promise that resolves to the root MountableFilesystem filesystem, the package creates and owns the root fs
 */
export const root = rootFs != null ? Promise.resolve(rootFs) : createFileSystem('MountableFileSystem', {}).then(root => {
    return initialize(root) as typeof root;
});

export function mountFileSystem(mountPoint: string, fs: FileSystem) {
    return root.then(root => {
        try {
            root.mount(mountPoint, fs);
            emit('mount', mountPoint, fs);
        } catch (error) {
            emit('error', error);
            throw error;
        }
    });
}

export function unmountFileSystem(mountPoint: string) {
    return root.then(root => {
        try {
            const current = root._getFs(mountPoint);
            root.umount(mountPoint);
            emit('unmount', mountPoint, fs);
            return current;
        } catch (error) {
            emit('error', error);
            throw error;
        }
    });
}
