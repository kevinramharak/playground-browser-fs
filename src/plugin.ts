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
    const browserfs = installBrowserFS();
    configureBrowserFS({
        fs: 'MountableFileSystem',
    }).then(() => {
        if (!window.browserfs) {
            window.browserfs = browserfs;
        }
    });

    return {
        id: "browserfs",
        displayName: "Browser FS",
        didMount: (sandbox, container) => {
            const ds = utils.createDesignSystem(container)
            
            ds.subtitle("Browser FS")
            ds.p(`This plugin sets up an instance of <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">Browser FS</a> (fork) to be used by other plugins.`);
            
            ds.subtitle('API');
            ds.p('see the <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">docs</a> for more information how to use BrowserFS in your plugin');

            ds.subtitle('current mount points:')

            const { root } = browserfs;
            const mountMap: { [mountPoint: string]: FileSystem<FileSystemType> } = (root as any).mntMap;
            let list = '';
            Object.entries(mountMap).forEach(([name, fs]) => {
                list += `- ${name} : ${fs.getName()}\n`;
            });

            ds.code(list);
        },
    }
}
