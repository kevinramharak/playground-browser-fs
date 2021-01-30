import ts from 'typescript';
import { FSModule } from 'browserfs/dist/node/core/FS';

type TS = typeof ts;

/**
 *  * Creates a system to be used for compiling typescript with the BrowserFS filesystem
 */
export function createSystem(fs: FSModule): ts.System {
    const newLine = '\n';
    const useCaseSensitiveFileNames = true;

    const encoding = 'utf-8';

    // NOTE: most of this is based on the ts.System that the typescript compiler uses in a node environment
    // NOTE: we take ts/vfs as a guide to implement the minimum amount to make the playground version work
    // see: typescript/src/compiler/sys.ts#1136

    const system: ts.System = {
        args: [],
        newLine,
        useCaseSensitiveFileNames,
        write(string: string) {
            console.log(string);
        },
        writeOutputIsTTY: () => false,
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
            // NOTE: uses a browser shim, value should be '/'
            return global.process.cwd();
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
            // NOTE: maybe ignore this instead?, doubt the shim does anything interesting
            return global.process.exit(code);
        },
        getExecutingFilePath() {
            return system.getCurrentDirectory();
        },
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
            }
            return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion, false) : undefined;
        },
        getDefaultLibFileName() {
            return host.getDefaultLibLocation!() + ts.getDefaultLibFileName(compilerOptions);
        },
        getDefaultLibLocation() {
            return system.getCurrentDirectory() + 'libs/';
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
            const modules = system.getDirectories('node_modules');
            // TODO: implement this
            return [] as (ts.ResolvedModuleFull | undefined)[];
        }
    };

    return host;
};
