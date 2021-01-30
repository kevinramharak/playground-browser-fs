/// <reference path="./global.d.ts" />

import type { editor } from 'monaco-editor';
import { configureBrowserFS, FileSystem, FileSystemType, installBrowserFS } from './browserfs';
import type { PluginUtils, PlaygroundPlugin } from './vendor/playground';
import type { Sandbox } from './vendor/sandbox';

interface IPluginData {

}

function highlight(sandbox: Sandbox, code: string, language: string, options: editor.IColorizerOptions = { tabSize: 2 }) {
    return sandbox.monaco.editor.colorize(code, language, options);
}

export function pluginFactory(utils: PluginUtils): PlaygroundPlugin {
    if (window.browserfs) {
        console.warn('browserfs already exists. this might cause issues');
    }

    const browserfs = installBrowserFS();
    const whenConfigured = configureBrowserFS({
        fs: 'MountableFileSystem',
        options: {},
    }).then((root) => {
        browserfs.root = root;
        window.browserfs = browserfs;
    });

    return {
        id: "browserfs",
        displayName: "Browser FS",
        didMount: (sandbox, container) => {
            const ds = utils.createDesignSystem(container)
            
            ds.subtitle("Browser FS")
            ds.p(`This plugin sets up an instance of <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">Browser FS</a> (fork) to be used by other plugins.`);
            
            ds.subtitle('API');
            const p = ds.p('see the <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">docs</a> for more information how to use BrowserFS in your plugin');

            const div = document.createElement('div');
            p.parentElement.appendChild(div);
            const subds = utils.createDesignSystem(div);

            subds.subtitle('BrowserFS is still initialising...');

            whenConfigured.then(() => {
                subds.clear();
                subds.subtitle('current mount points:')

                const { root } = browserfs;
                const mountMap: { [mountPoint: string]: FileSystem<FileSystemType> } = (root as any).mntMap;
                let list = '';
                if (!mountMap['/']) {
                    list += `- / : ${root._getFs('/').fs.getName()} - default`;
                }
                Object.entries(mountMap).forEach(([mountPoint, fs]) => {
                    list += `- ${mountPoint} : ${fs.getName()}\n`;
                });

                ds.code(list);
            }).catch(e => {
                subds.clear();
                subds.subtitle('Something went wrong while initialising BrowserFS');
                subds.code(e);
                throw e;
            });

        },
    }
}
