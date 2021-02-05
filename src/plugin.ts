import { root as rootFs, FileSystem, FileSystemName, fs, path } from './browserfs';
import { tabFactories } from './tabs';
import type { PluginUtils, PlaygroundPlugin } from './vendor/playground';

export default function pluginFactory(utils: PluginUtils): PlaygroundPlugin {
    async function createMountPointList() {
        const root = await rootFs;
        const mountMap: { [mountPoint: string]: FileSystem<FileSystemName> } = (root as any).mntMap;
        let list = '';
        if (!mountMap['/']) {
            list += `- / : ${root._getFs('/').fs.getName()} - default\n`;
        }
        Object.entries(mountMap).forEach(([mountPoint, fs]) => {
            list += `- ${mountPoint} : ${fs.getName()}\n`;
        });
        return list;
    }

    // TODO: externalize this
    const css = `
.browserfs-collapse summary > * {
    display: inline-block
}

.browserfs {
    background: #222;
    color: #afafaf;
    border-right: 1px #66e solid;
    font-family: monospace;
    max-height: 600px;
    overflow: auto;
}

.browserfs ::-webkit-details-marker{
    display: none;
}

.browserfs details {
    margin-top: 1px;
}

.browserfs details > summary {
    margin-top: 8px;
    color: #99e;
    padding: 4px 8px;
    background: #333;
    position: sticky;
    top: 0;
}

.browserfs details > summary:first-child {
    margin-top: 0;
}

.browserfs details > summary:before {
    content: '-';
    color: #eee;
    margin-right: 4px;
}

.browserfs details[open] > summary {
    background: #66e;
    color: #efefef;
}

.browserfs details[open] > summary:before {
    content: '+';
}

.browserfs .folder {
    margin: 0 0 4px 8px;
    padding: 0 0 4px 12px;
    border-left: 1px #66e dotted;
    border-bottom: 1px #66e dotted;
}

.browserfs .folder p {
    margin: 0 0 4px 0;
    padding: 4px 8px;
    background-color: #282828;
}

.browserfs .folder p:not(:first-child) {
    border-top: 1px #222 dashed;
}
`;

    const style = document.createElement('style');
    style.innerText = css;
    document.head.appendChild(style);

    const tabEntries = tabFactories.map(entry => entry(utils));

    const data = {
        tabEntries,
        active: tabEntries[0],
        tabContainer: document.createElement('div'),
    };

    const id = "browserfs";
    const displayName = "Browser FS";

    const getTabId = (tabId: string) => `playground-plugin-tab-${id}-${tabId}`;

    return {
        id,
        displayName,
        data,
        willMount: (sandbox, container) => {
            // based on https://github.com/microsoft/TypeScript-website/blob/v2/packages/typescriptlang-org/src/components/workbench/plugins/docs.ts#L247
            const ds = utils.createDesignSystem(container);
            const bar = ds.createTabBar();
            const tabs: HTMLElement[] = [];

            tabEntries.forEach(entry => {
                const tab = ds.createTabButton(entry.displayName);
                tab.id = getTabId(entry.id);
                tabs.push(tab);
                tab.onclick = () => {
                    const ds = utils.createDesignSystem(data.tabContainer);
                    
                    if (data.active.willUnmount) {
                        data.active.willUnmount(sandbox, data.tabContainer);
                    }
                    
                    ds.clear();
                    tabs.forEach(tab => tab.classList.remove('active'));

                    if (data.active.didUnmount) {
                        data.active.didUnmount(sandbox, data.tabContainer);
                    }

                    if (entry.willMount) {
                        entry.willMount(sandbox, data.tabContainer);
                    }

                    tab.classList.add('active');
                    data.active = entry;
                    
                    if (data.active.didMount) {
                        data.active.didMount(sandbox, data.tabContainer);
                    }
                };

                bar.appendChild(tab);
            });
            
            container.appendChild(bar);
            container.appendChild(data.tabContainer);

            if (data.active) {
                if (data.active.willMount) {
                    data.active.willMount(sandbox, data.tabContainer);
                }
                const activeTab = document.querySelector(`#${getTabId(data.active.id)}`);
                if (activeTab) {
                    activeTab.classList.add('active');
                }
                if (data.active.didMount) {
                    data.active.didMount(sandbox, data.tabContainer);
                }
            }
        },
        didMount: (sandbox, container) => {
            if (data.active.didMount) {
                data.active.didMount(sandbox, data.tabContainer);
            }
        },
        willUnmount: (sandbox, container) => {
            container.removeChild(data.tabContainer);
            if (data.active.willUnmount) {
                data.active.willUnmount(sandbox, data.tabContainer);
            }
        },
        didUnmount: (sandbox, container) => {
            if (data.active.didUnmount) {
                data.active.didUnmount(sandbox, data.tabContainer);
            }
        },
        modelChangedDebounce(sandbox, model, container) {
            fs.writeFile(sandbox.filepath, sandbox.getText());
            if (data.active.modelChangedDebounce) {
                data.active.modelChangedDebounce(sandbox, model, data.tabContainer);
            }
        },
    } as PlaygroundPlugin;
}
