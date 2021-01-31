import pluginFactory from './plugin';
import { BrowserFS, fs, path, process, Buffer, buffer, createFileSystem, mountFileSystem, unmountFileSystem } from './browserfs';
import { createCompilerHost, createSystem } from './tsbfs';

const browserfs = {
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

if (!(window as any).browserfs) {
    (window as any).browserfs = browserfs;
}

// TODO: vs.loader (i think) requires us to not mix imports. This way we let the playground initialise the plugin correctly, but will also let other packages consume the plugin as api namespace
Object.assign(pluginFactory, browserfs);

export default pluginFactory;
