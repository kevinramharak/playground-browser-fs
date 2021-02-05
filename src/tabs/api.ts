
import { parseMarkdown } from '../snarkdown';
import { PlaygroundPlugin, PluginUtils } from '../vendor/playground';

const externalLink = (text: string, href: string) => `<a href="${href}" rel="noopener" target="_blank">${text}</a>`;
const content = `
see the ${externalLink('docs', 'https://github.com/kevinramharak/playground-browser-fs#api')} for more information how to use BrowserFS in your plugin.
`;

export default function createApi(utils: PluginUtils): PlaygroundPlugin {
    const data = {};

    // TODO: fetch these files from github/unpackg
    const html = parseMarkdown(content).replace(/<br \/>/g, '<br /><br />');

    return {
        id: 'api',
        displayName: 'API',
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
