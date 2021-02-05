
import createMountPoints from './mounted';
import createApi from './api';
import createReadme from './readme';
import createFileExplorer from './fileExplorer';

// order them to show from first to last tab
export const tabFactories = [
    createReadme,
    createMountPoints,
    createFileExplorer,
    createApi,
];