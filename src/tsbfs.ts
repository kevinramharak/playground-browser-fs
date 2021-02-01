import type ts from 'typescript';
import { fs, path, process, root, createFileSystem, FileSystem } from './browserfs';
import resolve from 'browser-resolve';
import { JSONSchemaForNPMPackageJsonFiles } from './temp';

const { sync: resolveSync } = resolve;

type TS = typeof ts;

// NOTE: we mimic the `ts.sys` from `ts.getNodeSys()` as much as possible

interface SystemInternal {
    getEnvironmentVariable(name: string): string;
}

// TODO: move this to the BrowserFS fork
function mkdirpSync(directoryPath: string, mode = 0o777) {
    if (!fs.existsSync(directoryPath)) {
        mkdirpSync(path.dirname(directoryPath), mode);
        fs.mkdirSync(directoryPath, mode);
    }
}

/**
 * 
 */
const NODE_MODULES = '/node_modules';

/**
 * 
 */
const INDEXEDDB_STORE_NAME = 'playground-browser-fs@1.0.0-beta11::node_modules';

/**
 * This points to the file path of the typescript 'executable'
 * Based on the nodejs implementation of `sys.getExecutingFilePath()` which returns `__filename`
 * `__filename` in turn will be the `typescript/lib/typescript.js` file that is a bundle of the compiler build
 * NOTE: im not sure why `__filename` is used as this would probably break stuff if they ever move to a non-bundled build
 * see: `typescript/src/sys.ts#1214`
 */
const EXECUTING_FILE_PATH = `${NODE_MODULES}/typescript/lib/typescript.js`;

root.then(async (mountfs) => {
    if (!(mountfs as any)._containsMountPt(NODE_MODULES)) {
        const node_modules_fs = await createFileSystem({
            fs: 'AsyncMirror',
            options: {
                sync: { fs: 'InMemory' },
                async: { fs: 'IndexedDB', options: { storeName: INDEXEDDB_STORE_NAME } },
            }
        });
        mountfs.mount(NODE_MODULES, node_modules_fs);
        const hiddenFs = (mountfs as any).rootFs as FileSystem<'InMemory'>;
        // copy writes to `node_modules/**/*` that happend before `node_modules` was mounted
        if (hiddenFs.existsSync(NODE_MODULES) && hiddenFs.statSync(NODE_MODULES, false).isDirectory()) {
            hiddenFs.readdirSync(NODE_MODULES).forEach(entry => {
                console.warn(`${NODE_MODULES}/${entry} is being shadowed by the AsyncMirror { inMemory <=> IndexedDB }`);
            });
            // TODO: implement this in playground-browser-fs
            // copyRecursive(hiddenFs, mountfs, NODE_MODULES);
        }
    }
});

/**
 *  * Creates a system to be used for compiling typescript with the BrowserFS filesystem
 */
export function createSystem(): ts.System {
    const newLine = '\n';
    const useCaseSensitiveFileNames = true;

    const encoding = 'utf-8';

    // NOTE: most of this is based on the ts.System that the typescript compiler uses in a node environment
    // NOTE: we take ts/vfs as a guide to implement the minimum amount to make the playground version work
    // see: typescript/src/compiler/sys.ts#1136

    const system: ts.System & SystemInternal = {
        args: [],
        newLine,
        useCaseSensitiveFileNames,
        write(string: string) {
            // TODO: allow easier access to this function, tough nothing is stopping consumers from overriding this function
            console.log(`tsbfs :: sys.write :: ${string}`);
        },
        writeOutputIsTTY() {
            return process.stdout.isTTY;
        },
        readFile(path: string) {
            return fs.readFileSync(path, { encoding });
        },
        writeFile(filePath: string, content: string) {
            // write file should always ensure its directory should exist
            // see: typescript/src/compiler/sys.ts#954
            mkdirpSync(path.dirname(filePath));
            fs.writeFileSync(filePath, content, { encoding });
        },
        resolvePath: path => path,
        fileExists(path: string) {
            try {
                const stat = fs.statSync(path);
                if (stat && stat.isFile()) {
                    return true;
                }
            } catch (e) { }
            return false;
        },
        directoryExists(path: string) {
            try {
                const stat = fs.statSync(path);
                if (stat && stat.isDirectory()) {
                    return true;
                }
            } catch (e) { }
            return false;
        },
        createDirectory(path: string) {
            if (!system.directoryExists(path)) {
                try {
                    fs.mkdirSync(path)
                } catch (e) {
                    if (e.code !== 'EEXIST') {
                        throw e;
                    }
                }
            }
        },
        getCurrentDirectory() {
            return process.cwd();
        },
        getDirectories(path: string) {
            try {
                return fs.readdirSync(path);
            } catch (e) {
                return [];
            }
        },
        readDirectory(path: string, extensions?, exclude?, include?, depth?) {
            // TODO: implement this, the ts version looks pretty complicated
            return [];
        },
        exit(code?) {
            return process.exit(code);
        },
        getExecutingFilePath() {
            return EXECUTING_FILE_PATH;
        },
        getEnvironmentVariable(name: string) {
            return '';
        }
    };

    return system;
};

/**
 * Creates a compiler host to be used for compiling typescript with the BrowserFS filesystem
 */
export function createCompilerHost(system: ts.System, compilerOptions: ts.CompilerOptions, ts: TS): ts.CompilerHost {
    const host: ts.CompilerHost = {
        writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles) {
            try {
                system.writeFile(fileName, data, writeByteOrderMark);
            } catch (e) {
                if (onError) {
                    onError(e);
                }
            }
        },
        getCurrentDirectory: () => system.getCurrentDirectory(),
        fileExists: (fileName) => system.fileExists(fileName),
        readFile: fileName => system.readFile(fileName),
        getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
            // NOTE: taken straight from `typescript/src/program.ts#77`
            let text: string | undefined;
            try {
                text = host.readFile(fileName);
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
                text = "";
                return ts.createSourceFile(fileName, text, languageVersion, false);
            }
        },
        getDefaultLibFileName() {
            return host.getDefaultLibLocation!() + ts.getDefaultLibFileName(compilerOptions);
        },
        getDefaultLibLocation() {
            // NOTE: use of 2 internal functions, see `typescript/src/program.ts#167`
            return (ts as any).getDirectoryPath((ts as any).normalizePath(system.getExecutingFilePath()));
        },
        getCanonicalFileName(fileName) {
            return fileName;
        },
        getNewLine() {
            return system.newLine;
        },
        useCaseSensitiveFileNames() {
            return system.useCaseSensitiveFileNames;
        },
        /**
         * see: https://www.typescriptlang.org/docs/handbook/module-resolution.html
         * for now use: https://github.com/browserify/browser-resolve#readme
         * TODO: support more/all ts options?
         */
        resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, options) {
            return moduleNames.map(moduleName => {
                try {
                    // TODO: cache
                    const packageJsonPath = resolveSync(`${moduleName}/package.json`);
                    const packageDirectoryPath = path.dirname(packageJsonPath);
                    const packageJson: JSONSchemaForNPMPackageJsonFiles = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    if (packageJson.main) {
                        return {
                            resolvedFileName: path.resolve(packageDirectoryPath, packageJson.main),
                            extension: path.extname(packageJson.main),
                            isExternalLibraryImport: packageDirectoryPath.startsWith(NODE_MODULES),
                            packageId: {
                                name: packageJson.name,
                                subModuleName: path.basename(packageJson.main).startsWith('index') ? '' : path.dirname(packageJson.main),
                                version: packageJson.version,
                            },
                        } as ts.ResolvedModuleFull;
                    }
                } catch (e) {
                    return;
                }
            }) as (ts.ResolvedModuleFull | undefined)[];
        },
        resolveTypeReferenceDirectives(moduleNames, containingFile, redirectedReference, options) {
            return moduleNames.map(moduleName => {
                // TODO: cache
                const packageJsonPath = resolveSync(`${moduleName}/package.json`);
                const packageDirectoryPath = path.dirname(packageJsonPath);
                const packageJson: JSONSchemaForNPMPackageJsonFiles = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                const types = packageJson.types || packageJson.typings;
                if (types) {
                    return {
                        resolvedFileName: path.resolve(packageDirectoryPath, types),
                        extension: path.extname(types),
                        primary: true,
                        isExternalLibraryImport: packageDirectoryPath.startsWith(NODE_MODULES),
                        packageId: {
                            name: packageJson.name,
                            subModuleName: path.basename(types).startsWith('index') ? '' : path.dirname(types),
                            version: packageJson.version,
                        },
                    } as ts.ResolvedTypeReferenceDirective;
                }
            }) as ts.ResolvedTypeReferenceDirective[];
        },
    };

    return host;
};
