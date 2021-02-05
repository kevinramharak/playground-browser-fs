import BrowserFSModule from 'browserfs';
import { createFileSystem, root, mountFileSystem, unmountFileSystem } from './api';
import { eventifyFs } from './eventify';
import { promisifyFs } from './promisify';
import { FileSystemName, FileSystem, FileSystemConfiguration } from './types';

const { BFSRequire } = BrowserFSModule;

export const buffer = BFSRequire('buffer');
export const Buffer = buffer.Buffer as unknown as Buffer; // without this cast .d.ts generates typeof globalThis.Buffer
export const path = BFSRequire('path');
export const process = BFSRequire('process');
export const BrowserFS = BrowserFSModule;

// TODO: patch constants https://nodejs.org/api/fs.html#fs_fs_constants_1
// TODO: move the monkey patching to the browserfs fork
// add the promisify api to `fs`
export const fs = eventifyFs(
    promisifyFs(
        BFSRequire('fs')
    )
);

// add the event system to `fs`
// preferably mock chokidar
// for now roll a simple monkey patch one

export {
    createFileSystem,
    root,
    mountFileSystem,
    unmountFileSystem,
    FileSystem,
    FileSystemName,
    FileSystemConfiguration,
}
