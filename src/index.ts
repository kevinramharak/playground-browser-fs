import pluginFactory from './plugin';
import { BrowserFS, fs, path, process, Buffer, buffer, root, createFileSystem, mountFileSystem, unmountFileSystem } from './browserfs';
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
    root,
    createFileSystem,
    mountFileSystem,
    unmountFileSystem,
};

if (!(window as any).browserfs) {
    (window as any).browserfs = browserfs;
}

// FIXME: hack to have rollup not complain about mixing default and named exports, why it doesnt support it without making it hard baffles me
Object.assign(pluginFactory, browserfs);

export default pluginFactory;
