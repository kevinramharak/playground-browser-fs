import { PlaygroundPlugin } from '../vendor/playground';
import { PluginUtils } from '../vendor/pluginUtils';
import { fs, path } from '../browserfs';
import { off, on } from '../browserfs/eventify';

export default function createFileExplorer(utils: PluginUtils): PlaygroundPlugin {
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
            } else {
                const fault = document.createElement('p');
                fault.innerText = `${stat} is not a file or directory`;
                fault.setAttribute('data-file', fullPath);
                return fault;
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

    const data = {};

    let listeners: Record<string, (...args: any[]) => void> = {};

    function addListener(name: string, handler: (...args: any[]) => void) {
        on(name, handler);
    }

    return {
        id: 'file-explorer',
        displayName: 'Explorer',
        data,
        willMount(sandbox, container) {
            const ds = utils.createDesignSystem(container);

            function updateFileTree() {
                ds.clear();
                const tree = createFileTree();
                container.appendChild(tree);
            }

            addListener('writeFile', updateFileTree);
            addListener('rename', updateFileTree);
            addListener('mkdir', updateFileTree);
            addListener('rmdir', updateFileTree);
            addListener('unlink', updateFileTree);

            updateFileTree();
        },
        didMount() {

        },
        willUnmount(sandbox, container) {
            Object.entries(listeners).forEach(([name, handler]) => {
                off(name, handler);
            });
            listeners = {};
        },
        didUnmount(sandbox, container) {

        },
    }
}
