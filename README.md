[![Join the chat at https://gitter.im/ethereum/remix](https://badges.gitter.im/ethereum/remix.svg)](https://gitter.im/ethereum/remix?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![CircleCI](https://circleci.com/gh/ethereum/remix-project.svg?style=svg)](https://circleci.com/gh/ethereum/remix-project)
[![Documentation Status](https://readthedocs.org/projects/docs/badge/?version=latest)](https://remix-ide.readthedocs.io/en/latest/index.html)

# Remix Project

**Remix Project** is a platform for development tools that use a plugin architecture. It encompasses sub-projects including Remix Plugin Engine, Remix Libraries, and of course Remix IDE.

**Remix IDE** is an open source web and desktop application. It fosters a fast development cycle and has a rich set of plugins with intuitive GUIs. Remix is used for the **entire journey of contract development with [Solidity language](https://soliditylang.org/)** in as well as being a playground for learning and teaching Ethereum.

To try web app, visit: [https://remix.ethereum.org](https://remix.ethereum.org).

For desktop version, See releases: [https://github.com/ethereum/remix-desktop/releases](https://github.com/ethereum/remix-desktop/releases)

![Remix screenshot](https://github.com/ethereum/remix-project/raw/master/apps/remix-ide/remix_screenshot.png)

**Remix libraries** work as a core of native plugins of Remix IDE. Read more about libraries [here](libs/README.md)

## Offline Usage

The `master` branch has always the latest stable build of Remix. It also contains a ZIP file with the entire build. Download it to use offline.

Note: It contains the latest release of Solidity available at the time of the packaging. No other compiler versions are supported.


## Setup

Install **npm** and **node.js** (see https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), then
install [Nx CLI](https://nx.dev/react/cli/overview) globally to enable running **nx executable commands**.
```bash
npm install -g @nrwl/cli
```

Clone the github repository (`wget` need to be installed first):

```bash
git clone https://github.com/ethereum/remix-project.git
```

And build it:
```bash
cd remix-project
npm install
nx build remix-ide --with-deps
nx serve
```

Run `nx serve` and open `http://127.0.0.1:8080` in your browser.

Then open your `text editor` and start developing.
The browser will automatically refresh when files are saved.

## Production Build
To generate react production builds for remix-project.
```bash
npm run build:production
```
build can be found in `remix-project/dist/apps/remix-ide` directory.

```bash
npm run serve:production
```
production build will be served by default to `http://localhost:8080/` or `http://127.0.0.1:8080/`

## Docker:

Prerequisites: 
* Docker (https://docs.docker.com/desktop/)
* Docker Compose (https://docs.docker.com/compose/install/)

### Run with docker

If you want to run latest changes that are merged into master branch then run:

```
docker pull remixproject/remix-ide:latest
docker run -p 8080:80 remixproject/remix-ide:latest
```

If you want to run latest remix-live release run.
```
docker pull remixproject/remix-ide:remix_live
docker run -p 8080:80 remixproject/remix-ide:remix_live
```

### Run with docker-compose:

To run locally without building you only need docker-compose.yaml file and you can run:

```
docker-compose pull
docker-compose up -d
```

Then go to http://localhost:8080 and you can use you Remix instance.

To fetch docker-compose file without cloning this repo run:
```
curl https://raw.githubusercontent.com/ethereum/remix-project/master/docker-compose.yaml > docker-compose.yaml
```

### Troubleshooting building

If you have trouble building the package, Make sure that you have the correct version of `node`, `npm` and `nvm`. Also ensure you have [Nx CLI](https://nx.dev/react/cli/overview) installed globally.

Run:

```bash
node --version
npm --version
nvm --version
```

In Debian based OS such as Ubuntu 14.04LTS you may need to run `apt-get install build-essential`. After installing `build-essential`, run `npm rebuild`.

## Unit Testing

Run the unit tests via: `nx test <project-name>`
```bash
    nx test remix-analyzer
```

Running unit tests via `nx test` requires at least node v10.0.0

## Browser Testing

To run the Selenium tests via Nightwatch:

 - Build Remix IDE and serve it: `nx build remix-ide --with-deps && nx serve` # starts web server at localhost:8080
 - Make sure Selenium is installed `npm run selenium-install` # don't need to repeat
 - Run a selenium server `npm run selenium`
 - Run all the tests `npm run nightwatch_local_firefox` or `npm run nightwatch_local_chrome`
 - Or run a specific test case: 
 
		- npm run nightwatch_local_ballot

        - npm run nightwatch_local_usingWorker
		
		- npm run nightwatch_local_libraryDeployment
		
		- npm run nightwatch_local_solidityImport
		
		- npm run nightwatch_local_recorder
		
		- npm run nightwatch_local_transactionExecution
		
		- npm run nightwatch_local_staticAnalysis
		
		- npm run nightwatch_local_signingMessage

        - npm run nightwatch_local_specialFunctions

        - npm run nightwatch_local_solidityUnitTests

        - npm run nightwatch_local_remixd # remixd needs to be run

		- npm run nightwatch_local_terminal

        - npm run nightwatch_local_gist

        - npm run nightwatch_local_workspace

        - npm run nightwatch_local_defaultLayout

        - npm run nightwatch_local_pluginManager

        - npm run nightwatch_local_publishContract

        - npm run nightwatch_local_generalSettings

        - npm run nightwatch_local_fileExplorer

        - npm run nightwatch_local_debugger

        - npm run nightwatch_local_editor

        - npm run nightwatch_local_compiler

        - npm run nightwatch_local_txListener

        - npm run nightwatch_local_fileManager

        - npm run nightwatch_local_runAndDeploy
		
        
**NOTE:**

- **the `ballot` tests suite** requires to run `ganache-cli` locally.

- **the `remixd` tests suite** requires to run `remixd` locally.

- **the `gist` tests suite** requires specifying a github access token in **.env file**. 
```
    gist_token = <token>
```
**note that this token should have permission to create a gist.**


## Important Links

- Official documentation: https://remix-ide.readthedocs.io/en/latest/
- Curated list of Remix resources, tutorials etc.: https://github.com/ethereum/awesome-remix
- Medium: https://medium.com/remix-ide
- Twitter: https://twitter.com/ethereumremix
