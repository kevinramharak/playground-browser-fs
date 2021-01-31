import * as host from './browserfs';
import * as tsbfs from './tsbfs';
import pluginFactory from './plugin';

/**
 * 
 * @internal
 */
declare var define: undefined | ((moduleName: string, dependencies: string[], module: (...dependencies: any[]) => any) => void);

/**
 * expose the host object as a amd module
 * we use an explicit name so that other plugins can easily reference the module, with dynamic names it just wont work
 * this does require every plugin that uses this module to set `{ externals: ['playground-browser-fs'] }`
 * I assume this fixes all the asyncisity that happens with the loading of different playgrounds and initialising browser fs
 */
if (typeof define === 'function') {
    define('playground-browser-fs', [], function () {
        return {
            ...host,
            ...tsbfs,
        };
    });
}

if (!globalThis.browserfs) {
    globalThis.browserfs = host;
}

export default pluginFactory;
