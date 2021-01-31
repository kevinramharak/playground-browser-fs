import { root as rootFs, FileSystem, FileSystemType } from './browserfs';
import type { PluginUtils, PlaygroundPlugin } from './vendor/playground';

export default function pluginFactory(utils: PluginUtils): PlaygroundPlugin {
    async function createMountPointList() {
        const root = await rootFs;
        const mountMap: { [mountPoint: string]: FileSystem<FileSystemType> } = (root as any).mntMap;
        let list = '';
        if (!mountMap['/']) {
            list += `- / : ${root._getFs('/').fs.getName()} - default\n`;
        }
        Object.entries(mountMap).forEach(([mountPoint, fs]) => {
            list += `- ${mountPoint} : ${fs.getName()}\n`;
        });
        return list;
    }

    return {
        id: "browserfs",
        displayName: "Browser FS",
        didMount: async (sandbox, container) => {
            const ds = utils.createDesignSystem(container)
            
            ds.subtitle("Browser FS")
            ds.p(`This plugin sets up an instance of <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">Browser FS</a> (fork) to be used by other plugins.`);
            
            ds.subtitle('API');
            const p = ds.p('see the <a href="https://github.com/kevinramharak/playground-browser-fs#api" rel="noopener" target="_blank">docs</a> for more information how to use BrowserFS in your plugin');

            const div = document.createElement('div');
            p.parentElement.appendChild(div);

            const list = await createMountPointList();
            ds.subtitle('current mount points:')
            const code = ds.code(list);

            ds.button({ label: 'refresh list', onclick: async () => {
                const list = await createMountPointList();
                code.innerHTML = list;
            }}).style.marginTop = '16px';
        },
    }
}
