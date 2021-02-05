import type { FSModule } from 'browserfs/dist/node/core/FS';

/**
 * NOTE: overloads mess up these type args, module augmentation should fix that
 */
function promisify<TArgs extends any[], TError extends Error, TResult>(
    fn: (...fnArgs: [...cbArgs: TArgs, callback: (error?: TError, result?: TResult) => void]) => void
): (...args: TArgs) => Promise<TResult> {
    return function (...args: TArgs) {
        return new Promise((resolve, reject) => {
            fn(...args, (error?: TError, value?: TResult) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(value!);
                }
            });
        });
    }
}

// class FileHandle ? https://nodejs.org/api/fs.html#fs_class_filehandle

const methods = [
    // https://nodejs.org/api/fs.html#fs_fspromises_access_path_mode
    'access',
    // https://nodejs.org/api/fs.html#fs_fspromises_appendfile_path_data_options
    'appendFile',
    // https://nodejs.org/api/fs.html#fs_fspromises_chmod_path_mode
    'chmod',
    // https://nodejs.org/api/fs.html#fs_fspromises_chown_path_uid_gid
    'chown',
    // https://nodejs.org/api/fs.html#fs_fspromises_lchmod_path_mode
    'lchmod',
    // https://nodejs.org/api/fs.html#fs_fspromises_lchown_path_uid_gid
    'lchown',
    // https://nodejs.org/api/fs.html#fs_fspromises_lutimes_path_atime_mtime
    'utimes',
    // https://nodejs.org/api/fs.html#fs_fspromises_link_existingpath_newpath
    'link',
    // https://nodejs.org/api/fs.html#fs_fspromises_lstat_path_options
    'lstat',
    // https://nodejs.org/api/fs.html#fs_fspromises_mkdir_path_options
    'mkdir',
    // https://nodejs.org/api/fs.html#fs_fspromises_open_path_flags_mode
    'open',
    // https://nodejs.org/api/fs.html#fs_fspromises_readdir_path_options
    'readdir',
    // https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options
    'readFile',
    // https://nodejs.org/api/fs.html#fs_fspromises_readlink_path_options
    'readlink',
    // https://nodejs.org/api/fs.html#fs_fspromises_realpath_path_options
    'realpath',
    // https://nodejs.org/api/fs.html#fs_fspromises_rename_oldpath_newpath
    'rename',
    // https://nodejs.org/api/fs.html#fs_fspromises_rmdir_path_options
    'rmdir',
    // https://nodejs.org/api/fs.html#fs_fspromises_stat_path_options
    'stat',
    // https://nodejs.org/api/fs.html#fs_fspromises_symlink_target_path_type
    'symlink',
    // https://nodejs.org/api/fs.html#fs_fspromises_truncate_path_len
    'truncate',
    // https://nodejs.org/api/fs.html#fs_fspromises_unlink_path
    'unlink',
    // https://nodejs.org/api/fs.html#fs_fspromises_utimes_path_atime_mtime
    'utimes',
    // https://nodejs.org/api/fs.html#fs_fspromises_writefile_file_data_options
    'writeFile',
];

export function promisifyFs(fs: FSModule) {
    // TODO: write module augmentation
    // TODO: this is all experimental without tests
    (fs as any).promises = methods.reduce((namespace, method) => {
        const func = fs[method as keyof typeof fs];
        if (typeof func === 'function') {
            namespace[method] = promisify((func as Function).bind(fs));
        }
        return namespace;
    }, {} as any);
    return fs;
}
