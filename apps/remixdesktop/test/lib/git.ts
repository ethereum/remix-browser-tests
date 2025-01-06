import { spawn, ChildProcess } from "child_process"

export async function getBranches(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const git = spawn('git', ['branch'], { cwd: path })
        let branches = ''
        git.stdout.on('data', function (data) {
            console.log('stdout git branches', data.toString())
            branches += data.toString()
        })
        git.stderr.on('data', function (data) {
            console.log('stderr git branches', data.toString())
            reject(data.toString())
        })
        git.on('close', function () {
            resolve(branches)
        })
    })
}

export async function getGitLog(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const git = spawn('git', ['log'], { cwd: path })
        let logs = ''
        git.stdout.on('data', function (data) {
            logs += data.toString()
        })
        git.stderr.on('err', function (data) {
            reject(data.toString())
        })
        git.on('close', function () {
            resolve(logs)
        })
    })
}

export async function cloneOnServer(repo: string, path: string, name: string = 'bare') {
    console.log('cloning', repo, path)
    return new Promise((resolve, reject) => {
        const git = spawn(`rm -rf ${name} && git`, ['clone', repo], { cwd: path, shell: true, detached: true });

        git.stdout.on('data', function (data) {
            console.log('stdout data cloning', data.toString());
            if (data.toString().includes('done')) {
                resolve(git);
            }
        });

        git.stderr.on('data', function (data) {
            console.log('stderr data cloning', data.toString());
            if (data.toString().includes('into')) {
                setTimeout(() => {
                    resolve(git);
                }, 5000)
            }
        });

        git.on('error', (error) => {
            reject(`Process error: ${error.message}`);
        });

        git.on('exit', (code, signal) => {
            if (code !== 0) {
                reject(`Process exited with code: ${code} and signal: ${signal}`);
            }
        });
    });
}

export async function onLocalGitRepoAddFile(path: string, file: string) {
    console.log('adding file', file)
    return new Promise((resolve, reject) => {
        const git = spawn('touch', [file], { cwd: path });

        git.stdout.on('data', function (data) {
            console.log('stdout data adding file', data.toString());
            if (data.toString().includes('done')) {
                resolve(git);
            }
        });

        git.stderr.on('data', function (data) {
            console.error('stderr adding file', data.toString());
            reject(data.toString());
        });

        git.on('error', (error) => {
            reject(`Process error: ${error.message}`);
        });

        git.on('exit', (code, signal) => {
            if (code !== 0) {
                reject(`Process exited with code: ${code} and signal: ${signal}`);
            } else {
                resolve(git);
            }
        });
    });
}

export async function onLocalGitRepoPush(path: string, branch: string = 'master') {
    console.log('pushing', path)
    return new Promise((resolve, reject) => {
        const git = spawn('git', ['push', 'origin', branch], { cwd: path, shell: true, detached: true });

        git.stdout.on('data', function (data) {
            console.log('stdout data pushing', data.toString());
            if (data.toString().includes('done')) {
                resolve(git);
            }
        });

        git.stderr.on('data', function (data) {
            console.error('stderr data pushing', data.toString());
            if (data.toString().includes(branch)) {
                resolve(git);
            }
        });

        git.on('error', (error) => {
            reject(`Process error: ${error.message}`);
        });

        git.on('exit', (code, signal) => {
            if (code !== 0) {
                reject(`Process exited with code: ${code} and signal: ${signal}`);
            } else {
                resolve(git);
            }
        });
    });
}


export async function createCommitOnLocalServer(path: string, message: string) {
    console.log('committing', message, path)
    return new Promise((resolve, reject) => {
        const git = spawn('git add . && git', ['commit', '-m', message], { cwd: path, shell: true, detached: true });

        git.stdout.on('data', function (data) {
            console.log('data stdout committing', data.toString());
            if (data.toString().includes(message)) {
                setTimeout(() => {
                    resolve(git);
                }, 1000)
            }
        });

        git.stderr.on('data', function (data) {
            console.error('data committing', data.toString());
            reject(data.toString());
        });

        git.on('error', (error) => {
            console.error('error', error);
            reject(`Process error: ${error.message}`);
        });

        git.on('exit', (code, signal) => {
            if (code !== 0) {
                console.error('exit', code, signal);
                reject(`Process exited with code: ${code} and signal: ${signal}`);
            } else {
                resolve(git);
            }
        });
    });
}


export async function spawnGitServer(path: string): Promise<ChildProcess> {
    console.log(process.cwd())
    try {
        const server = spawn('yarn && sh setup.sh && yarn start:server', [`${path}`], { cwd: process.cwd() + '/../remix-ide-e2e/src/githttpbackend/', shell: true, detached: true })
        console.log('spawned', server.stdout.closed, server.stderr.closed)
        return new Promise((resolve, reject) => {
            server.stdout.on('data', function (data) {
                console.log(data.toString())
                if (
                    data.toString().includes('is listening')
                    || data.toString().includes('address already in use')
                ) {
                    console.log('resolving')
                    resolve(server)
                }
            })
            server.stderr.on('err', function (data) {
                console.log(data.toString())
                reject(data.toString())
            })
        })
    } catch (e) {
        console.log(e)
    }
}