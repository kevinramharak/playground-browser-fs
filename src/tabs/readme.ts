
import { parseMarkdown } from '../snarkdown';
import { PlaygroundPlugin, PluginUtils } from '../vendor/playground';

const externalLink = (text: string, href: string) => `<a href="${href}" rel="noopener" target="_blank">${text}</a>`;

const content = `
This plugin sets up an instance of ${externalLink('BrowserFS', 'https://github.com/kevinramharak/BrowserFS')} (fork) to be used by other plugins.
`;

export default function createReadme(utils: PluginUtils): PlaygroundPlugin {
    const data = {};

    const html = parseMarkdown(content);

    return {
        id: 'readme',
        displayName: 'Readme',
        data,
        willMount(sandbox, container) {
            const ds = utils.createDesignSystem(container);
            container.innerHTML = html;
        },
        didMount() {

        },
        willUnmount(sandbox, container) {

        },
        didUnmount(sandbox, container) {

        },
    }
}
