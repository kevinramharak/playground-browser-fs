import { BrowserFS, fs, path, process, Buffer, buffer, createFileSystem, mountFileSystem, unmountFileSystem } from './src/browserfs';
import { createCompilerHost, createSystem } from './src/tsbfs';

/** expose the plugin as a named import */
declare module 'playground-browser-fs' {
    export {
        fs,
        path,
        buffer,
        Buffer,
        process,
        BrowserFS,
        createCompilerHost,
        createFileSystem,
        createSystem,
        mountFileSystem,
        unmountFileSystem,
    };
}
