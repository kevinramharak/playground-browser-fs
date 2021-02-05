import { PlaygroundPlugin, PluginUtils } from '../vendor/playground';

export default function mountedFactory(utils: PluginUtils): PlaygroundPlugin {
    const data = {};

    return {
        id: 'mounted',
        displayName: 'Mounted',
        data,
        willMount(sandbox, container) {
            const ds = utils.createDesignSystem(container);
        },
        didMount() {

        },
        willUnmount(sandbox, container) {

        },
        didUnmount(sandbox, container) {

        },
    }
}
