import fs from './fileSystem'
import async from 'async'
import path from 'path'
let RemixCompiler = require('remix-solidity').Compiler
import { SrcIfc } from './types'

function regexIndexOf (inputString: string, regex: RegExp, startpos: number = 0) {
    const indexOf = inputString.substring(startpos).search(regex)
    return (indexOf >= 0) ? (indexOf + (startpos)) : indexOf
}

function writeTestAccountsContract (accounts: string[]) {
    const testAccountContract = require('../sol/tests_accounts.sol.js')
    let body = `address[${accounts.length}] memory accounts;`
    if (!accounts.length) body += ';'
    else {
        accounts.map((address, index) => {
            body += `\naccounts[${index}] = ${address};\n`
        })
    }
    return testAccountContract.replace('>accounts<', body)
}

function processFile(filePath: string, sources: any, isRoot: boolean = false) {
    try{
        const importRegEx = /import ['"](.+?)['"];/g;
        let group: any ='';
        if(filePath.includes('tests.sol') || filePath.includes('remix_tests.sol') || filePath.includes('remix_accounts.sol') || Object.keys(sources).includes(filePath))
            return

        let content = fs.readFileSync(filePath, { encoding: 'utf-8' });
        const s = /^(import)\s['"](remix_tests.sol|tests.sol)['"];/gm
        if (isRoot && filePath.indexOf('_test.sol') > 0 && regexIndexOf(content, s) < 0) {
            const includeTestLibs = '\nimport \'remix_tests.sol\';\n'
            content = includeTestLibs.concat(content)
        }
        sources[filePath] = {content};
        importRegEx.exec(''); // Resetting state of RegEx
        while (group = importRegEx.exec(content)) {
            const importedFile = group[1];
            const importedFilePath = path.join(path.dirname(filePath), importedFile);
            processFile(importedFilePath, sources)
        }
    }
    catch(error){
      throw error;
    }
  };

const userAgent = (typeof (navigator) !== 'undefined') && navigator.userAgent ? navigator.userAgent.toLowerCase() : '-'
const isBrowser = !(typeof (window) === 'undefined' || userAgent.indexOf(' electron/') > -1)

// TODO: replace this with remix's own compiler code
export function compileFileOrFiles(filename: string, isDirectory: boolean, opts: any, cb: Function) {
    let compiler: any
    let accounts = opts.accounts || []
    const sources = {
        'tests.sol': { content: require('../sol/tests.sol.js') },
        'remix_tests.sol': { content: require('../sol/tests.sol.js') },
        'remix_accounts.sol': { content: writeTestAccountsContract(accounts) }
    }
    const filepath = (isDirectory ? filename : path.dirname(filename))
    try {
        if(!isDirectory && fs.existsSync(filename)) {
            if (filename.split('.').pop() === 'sol') {
                processFile(filename, sources, true)
            } else {
                throw new Error('Not a solidity file')
            }
        } else {
            // walkSync only if it is a directory
            fs.walkSync(filepath, (foundpath: string) => {
                // only process .sol files
                if (foundpath.split('.').pop() === 'sol') {
                    processFile(foundpath, sources, true)
                }
            })
        }
        
    } catch (e) {
        throw e
    } finally {
        async.waterfall([
            function loadCompiler(next: Function) {
                compiler = new RemixCompiler()
                compiler.onInternalCompilerLoaded()
                // compiler.event.register('compilerLoaded', this, function (version) {
                next()
                // });
            },
            function doCompilation(next: Function) {
                // @ts-ignore
                compiler.event.register('compilationFinished', this, (success, data, source) => {
                    next(null, data)
                })
                compiler.compile(sources, filepath)
            }
        ], function (err: Error | null | undefined, result: any) {
            let error: Error[] = []
            if (result.error) error.push(result.error)
            let errors = (result.errors || error).filter((e) => e.type === 'Error' || e.severity === 'error')
            if (errors.length > 0) {
                if (!isBrowser) require('signale').fatal(errors)
                return cb(errors)
            }
            cb(err, result.contracts)
        })
    }
}

export function compileContractSources(sources: SrcIfc, versionUrl: any, usingWorker: any, importFileCb: any, opts: any, cb: Function) {
    let compiler, filepath: string
    let accounts = opts.accounts || []
    // Iterate over sources keys. Inject test libraries. Inject test library import statements.
    if (!('remix_tests.sol' in sources) && !('tests.sol' in sources)) {
        sources['remix_tests.sol'] = { content: require('../sol/tests.sol.js') }
        sources['remix_accounts.sol'] = { content: writeTestAccountsContract(accounts) }
    }
    const s = /^(import)\s['"](remix_tests.sol|tests.sol)['"];/gm
    let includeTestLibs = '\nimport \'remix_tests.sol\';\n'
    for (let file in sources) {
        const c = sources[file].content
        if (file.indexOf('_test.sol') > 0 && c && regexIndexOf(c, s) < 0) {
            sources[file].content = includeTestLibs.concat(c)
        }
    }

    async.waterfall([
        function loadCompiler (next: Function) {
            compiler = new RemixCompiler(importFileCb)
            compiler.loadVersion(usingWorker, versionUrl)
            // @ts-ignore
            compiler.event.register('compilerLoaded', this, (version) => {
                next()
            })
        },
        function doCompilation (next: Function) {
            // @ts-ignore
            compiler.event.register('compilationFinished', this, (success, data, source) => {
                next(null, data)
            })
            compiler.compile(sources, filepath)
        }
    ], function (err: Error | null | undefined , result: any) {
        let error: Error[] = []
        if (result.error) error.push(result.error)
        let errors = (result.errors || error).filter((e) => e.type === 'Error' || e.severity === 'error')
        if (errors.length > 0) {
            if (!isBrowser) require('signale').fatal(errors)
            return cb(errors)
        }
        cb(err, result.contracts)
    })
}
