import pluginFactory from './plugin';
import { BrowserFS, fs, path, process, Buffer, buffer, createFileSystem, mountFileSystem, unmountFileSystem } from './browserfs';
import { createCompilerHost, createSystem } from './tsbfs';

if (!(window as any).browserfs) {
    (window as any).browserfs = {
        createCompilerHost,
        createSystem,
        BrowserFS,
        fs,
        path,
        process,
        Buffer,
        buffer,
        createFileSystem,
        mountFileSystem,
        unmountFileSystem,
    };
}

export {
    createCompilerHost,
    createSystem,
    BrowserFS,
    fs,
    path,
    process,
    Buffer,
    buffer,
    createFileSystem,
    mountFileSystem,
    unmountFileSystem,
}

export default pluginFactory;
