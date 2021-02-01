import { root as rootFs, FileSystem, FileSystemType, onFileSystemMounted, fs, path } from './browserfs';
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

    function createDetailsFor(pathName: string) {
        const details = document.createElement('details');
        details.setAttribute('data-folder', pathName);
        const summary = document.createElement('summary');
        if (pathName === '/') {
            details.setAttribute('open', 'open');
        }
        summary.innerText = pathName === '/' ? pathName : path.basename(pathName);
        details.appendChild(summary);

        const children = fs.readdirSync(pathName).map(entry => {
            const fullPath = path.resolve(pathName, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                return createDetailsFor(fullPath);
            } else if (stat.isFile()) {
                const file = document.createElement('p');
                file.innerText = `${entry}`;
                file.setAttribute('data-file', fullPath);
                return file;
            }
        });

        const folder = document.createElement('div');
        folder.classList.add('folder');
        details.appendChild(folder);
        if (children.length) {
            folder.append(...children);
        } else {
            folder.innerHTML = `<small><p><i>empty folder</i></p></small>`;
        }

        return details;
    }

    function createFileTree() {
        const container = document.createElement('div');
        container.classList.add('browserfs');

        const root = createDetailsFor('/');
        container.appendChild(root);

        return container;
    }

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

    const deregisters = [];

    function createDetails(summary: HTMLElement, content: HTMLElement) {
        const details = document.createElement('details');
        const _summary = document.createElement('summary');
        details.classList.add('browserfs-collapse');
        _summary.appendChild(summary);
        details.append(_summary, content);
        return details;
    }

    return {
        id: "browserfs",
        displayName: "Browser FS",
        willMount: (sandbox, container) => {
            const ds = utils.createDesignSystem(container);

            container.appendChild(
                createDetails(
                    ds.subtitle("Browser FS"),
                    ds.p(`This plugin sets up an instance of <a href="https://github.com/kevinramharak/BrowserFS" rel="noopener" target="_blank">Browser FS</a> (fork) to be used by other plugins.`),
                )
            );

            container.appendChild(
                createDetails(
                    ds.subtitle('API'),
                    ds.p('see the <a href="https://github.com/kevinramharak/playground-browser-fs#api" rel="noopener" target="_blank">docs</a> for more information how to use BrowserFS in your plugin'),
                )
            );
            

            const code = ds.code('');
            container.appendChild(
                createDetails(
                    ds.subtitle('Mountpoints'),
                    code.parentElement,
                )
            );
            
            createMountPointList().then(list => {
                code.innerHTML = list;
            });

            deregisters.push(onFileSystemMounted(async () => {
                const list = await createMountPointList();
                code.innerHTML = list;
            }));

            const fileTreeContainer = document.createElement('div');
            ds.subtitle('File Explorer');
            ds.button({ label: 'refresh file tree', onclick() {
                rootFs.then(() => {
                    const tree = createFileTree();
                    while (fileTreeContainer.hasChildNodes()) {
                        fileTreeContainer.firstChild.remove();
                    }
                    fileTreeContainer.appendChild(tree);
                });
            }}).style.margin = '8px 0';
            container.appendChild(fileTreeContainer);
            
            rootFs.then(() => {
                const tree = createFileTree();
                while (fileTreeContainer.hasChildNodes()) {
                    fileTreeContainer.firstChild.remove();
                }
                fileTreeContainer.appendChild(tree);
            });
        },
        willUnmount: (sandbox, container) => {
            deregisters.forEach(deregister => deregister());
            deregisters.splice(0);
        },
        modelChangedDebounce(sandbox, model) {
            fs.writeFile(sandbox.filepath, sandbox.getText());
        },
    } as PlaygroundPlugin;
}
