import type ts from 'typescript';
import { fs, process } from './browserfs';

type TS = typeof ts;

// NOTE: we mimic the `ts.sys` from `ts.getNodeSys()` as much as possible

interface SystemInternal {
    getEnvironmentVariable(name: string): string;
}

/**
 * This points to the file path of the typescript 'executable'
 * Based on the nodejs implementation of `sys.getExecutingFilePath()` which returns `__filename`
 * `__filename` in turn will be the `typescript/lib/typescript.js` file that is a bundle of the compiler build
 * NOTE: im not sure why `__filename` is used as this would probably break stuff if they ever move to a non-bundled build
 * see: `typescript/src/sys.ts#1214`
 */
const EXECUTING_FILE_PATH = 'node_modules/typescript/lib/typescript.js';

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
        writeFile(path: string, content: string) {
            fs.writeFileSync(path, content, { encoding });
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
        ...system,
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
        resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference, options) {
            return moduleNames.map(moduleName => {

                return undefined;
            }) as (ts.ResolvedModuleFull | undefined)[];
        }
    };

    return host;
};
