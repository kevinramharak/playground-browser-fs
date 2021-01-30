import type { BrowserFSHost } from './browserfs';

declare global {
    interface Window {
        browserfs: BrowserFSHost;
    }

    var browserfs: BrowserFSHost;
}
