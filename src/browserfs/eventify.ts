import type { FSModule } from 'browserfs/dist/node/core/FS';

type Subscriber = (...args: any[]) => void;

const events = [
    // these should be on Mountable fs root instance
    'mount',
    'umount',
    // these should be on fs
    'mkdir',
    'rmdir',
    'rename',
    'unlink',
    'truncate',
    'writeFile',
    // not sure what this should do, for now report on errors thrown in the tracked functions
    'error',
] as const;

const subscribers: {
    [eventName: string]: Subscriber[],
} = events.reduce((map, event) => {
    map[event] = [];
    return map;
}, {} as any);

/**
 * @internal
 */
export function emit(eventName: string, ...args: any[]) {
    const subs = subscribers[eventName];
    // attempt to mimic asyncicity, a chokidar like 'implementation' or implement a native one in the BrowserFS fork would be better
    return Promise.resolve().then(() => {
        subs.forEach(sub => sub(...args));
    });
}

export function on(eventName: string, callback: (...args: any[]) => void) {
    const subs = subscribers[eventName];
    if (subs) {
        subs.push(callback);
    } else {
        throw new Error(`event ${eventName} is not supported`)
    }
}

export function off(eventName: string, callback: (...args: any[]) => void) {
    const subs = subscribers[eventName];
    if (subs) {
        const index = subs.indexOf(callback);
        if (index !== -1) {
            subs.splice(index, 1);
        }
    }
}

/**
 * For now just support tracking when a function is being called
 */
export function eventifyFs(fs: FSModule) {
    events.forEach((name: string) => {
        const syncName = `${name}Sync` as keyof typeof fs;
        const method = fs[name as keyof typeof fs] as Function;
        const methodSync = fs[syncName];
        if (typeof method === 'function') {
            const original = method.bind(fs);
            // @ts-ignore
            fs[name] = function (...args: [...args: any[], cb: (error?: Error, value?: any) => void]) {
                const cb = args.splice(-1, 1) as any;
                return original(...args, (error?: Error, result?: any) => {
                    if (error) {
                        emit('error', error);
                    } else {
                        emit(name, result!);
                    }
                    cb(error, result);
                });
            }
        }
        if (method) {
            const original = method.bind(fs);
            // @ts-ignore
            fs[name] = function (...args: any[]) {
                try {
                    const result = original(...args);
                    emit(name, result);
                    return result;
                } catch (error) {
                    emit('error', error);
                    throw error;
                }
            }
        }
    });
    return fs;
}
