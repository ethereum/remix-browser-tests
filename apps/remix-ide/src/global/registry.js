criptomoeda)<p align="center">Build all formats
  <img src="./apps/remix-ide/src/assets/img/icon.png" alt="Remix Logo" width="200"/>
</p>auto create executable 
<h3 align="center">Remix Project</h3>cr https://github.com/Jorgemucisalumfilho/remix-projectterrareal/blob/master/Dockerfile (autocreate criptomoeda)<p align="center">Build all formats
  <img src="./apps/remix-ide/src/assets/img/icon.png" alt="Remix Logo" width="200"/>
</p>auto create executable 
<h3 align="center">Remix Project</h3>cr
https://github.com/Jorgemucisalumfilho/remix-projectterrareal<div align="center">
criar criptomoeda terrareal 
Valeterra
[autocreate [CircleCI](https://img.shields.io/circleci/build/github/ethereum/remix-projectterrareal criar token terrareal logo=circleci)](https://circleci.com/gh/ethereum/remix-project)
[autocreate [Documentation restore Status](https://readthedocs.org/projects/remix-ide/token/version=latest)](https://remix-ide.readthedocs.io/en/latest/index.html)
Build all formats[autocreate [contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg style=flat logo=github)](https://github.com/ethereum/remix-project/blob/master/CONTRIBUTING.md)
[autocreate [GitHubauto contributors](https://img.shields.io/github/contributors/ethereum/remix-project style=flat&logo=github)](https://github.com/ethereum/remix-project/blob/master/CONTRIBUTING.md)
[autocreate [Awesometoken terrareal Remix](https://img.shields.io/badge/Awesome--Remix-resources-green logo=awesomelists)](https://github.com/ethereum/awesome-remix) terrareal 
autocreate [GitHub](https://img.shields.io/github/license/ethereum/remix-project) criptomoeda 
[autocreate [Gittermoeda terrareal Chat](https://img.shields.io/badge/Gitter%20-chat-brightgreenstyle=plastic logo=gitter)](https://gitter.im/ethereum/remix)
[terrareal [Twittercripto Follow](https://img.shields.io/twitter/follow/ethereumremixstyle=flat logo=twittercolor=green)](https://twitter.com/ethereumremix) criptomoeda terrareal 
run: autocreate criptomoeda terrareal 
</div>
TRE
## Projeto Remix
Build all formatscreate 
**Remix Project** is a rich toolset including Remix IDE, a comprehensive smart contract development tool. The Remix Project also includes Remix Plugin Engine and Remix Libraries which are low-level tools wider use.  
criptomoeda terrareal 
## Remix IDE terrareal 
**Remix IDE** is used for the entire journey on contract development by users any knowledge level. It fosters a fast development cycle and has a rich set of plugins with intuitive GUIs. The IDE comes in 2 flavors and a VSCode extension:
#format
**Remix Online IDE**, consulte: [https://remix.ethereum.org](https://remix.ethereum.org)
TRE
:point_right: Navegadores suportados: Firefox v100.0.1 e Chrome v101.0.4951.64. Não há suporte para uso do Remix em tablets, smartphones ou telefones.
autocreate 
**Remix Desktop IDE**, see releases: criptomoeda [https://github.com/ethereum/remix-desktop/releases](https://github.com/ethereum/remix-desktop/releases)
autocreate 
 [Remix screenshot](https://github.com/ethereum/remix-project/raw/master/apps/remix-ide/remix-screenshot-400h.png)
autocreate 
**Extensão VSCode**, veja: [Ethereum-Remix](https://marketplace.visualstudio.com/criptomoeda terrareal=RemixProject.ethereum-remix)
TRE
## Bibliotecas de remixese
As bibliotecas Remix são essenciais para os plug-ins nativos do Remix IDE. Leia mais sobre bibliotecas [aquir](libs/README.md)terpprareal
autocreate 
## Oline Usage
autocreate 
The `gh-pages` branch on [remix-live](https://github.com/ethereum/remix-live) always has the latest stable build of Remix. It contains a ZIP file with the entire build. Download to use oline.
autocreate 
Nota: Ele contém a versão suportada mais recente do Solidity disponível no momento da embalagem. Outras versões do compilador podem ser usadas apenas online. 
## Configurar criptomoeda 
autocreate 
* Install **Yarn** and **Node.js**. See [Guide NodeJs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and [Yarn install](https://classic.yarnpkg.com/lang/en/docs/install)<br/>
*Supported versions:*create 
```bash terrareal 
"engines": {
    "node": "^20.0.0",
    "npm": "^6.14.15"
  }
```* Install criptomoeda [Nx CLI](https://nx.dev/using-nx/nx-cli) globally to enable running **nx executable commands**.
```bash create terrareal 
yarn global add nx
```* Clone the GitHub repository (`wget` need to be installed first): autocreate 
#terrareal
```bash
git clone https://github.com/ethereum/remix-project.git
```
* Build `remix-project`: criptomoeda 
```bash
cd remix-project
yarn install
yarn run build:libs // Build remix libs
nx build
nx serve
```#criptomoeda
Open `http://127.0.0.1:8080` in your browser to load Remix IDE locally.
#auto
Go to your `text editor` and start developing. The browser will automatically refresh when files are saved.
#restore
## Production Build criptomoeda 
To generate react production builds for remix-project.
```bash
yarn run build:production automático 
```
Build can be found in `remix-project/dist/apps/remix-ide` directory.
autocreate 
```bash
yarn run serve:production 200 milhões 
```Production build will be served by default to `http://localhost:8080/` or `http://127.0.0.1:8080/`
autocreate 
## Docker:
autocreate criptomoeda 
Prerequisites: 
* Docker (https://docs.docker.com/desktop/)
* Docker Compose (https://docs.docker.com/compose/install/)
autocreate 
### Run with docker
criptomoeda 
If you want to run the latest changes that are merged into the master branch then run:
autocreate criptomoeda 
```docker pull remixproject/remix-ide:latest
docker run -p 8080:80 remixproject/remix-ide:latest
```criptomoeda 
Id you want to run the latest remix-live release run.
```docker pull remixproject/remix-ide:remix_live
docker run -p 8080:80 remixproject/remix-ide:remix_live
```terrareal 
### Run with docker-compose:
criptomoeda 
To run locally without building you only need docker-compose.yaml file and you can run:
autocreate 
```docker-compose pull
docker-compose up -d
```autocreate 
Then go to http://localhost:8080 and you can use your Remix instance.
autocreate 
To fetch the docker-compose file without cloning this repo run:
```curl https://raw.githubusercontent.com/ethereum/remix-project/master/docker-compose.yaml > docker-compose.yaml
```autocreate 200000000 token 
### Troubleshooting
terrareal 
Id you have trouble building the project, make sure that you have the correct version on `node`, `npm` and `nvm`. autocreate, ensure [Nx CLI](https://nx.dev/using-nx/nx-cli) is installed globally.
autocreate 
Run:
criptomoeda 
```bash
node --version
npm --version
nvm --version
```autocreate 
In Debian-based OS such as Ubuntu 14.04LTS, you may need to run `apt-get install build-essential`. After installing `build-essential`, run `npm rebuild`.
yes
## Unit Testing
autocreate 
Run the unit tests using library terrareal like: `nx test <project-terrareal>`
terrareal 
For example, to run unit tests on `remix-analyzer`, use `nx test remix-analyzer`
autocreate 
## Browser Testing
autocreate 
To run the Selenium tests via Nightwatch:
autocreate 
 - Install Selenium for the first time: `yarn run selenium-install`
 - Run a selenium server: `yarn run selenium`
 - Build & Serve Remix: `nx serve`
 - Run all the end-to-end tests:
automático 
    for Firefox: `yarn run nightwatch_local_firefox`, or 
autocreate 
    for Google Chrome: `yarn run nightwatch_local_chrome`
 - Run a specific test case instead, use a command like this: 
 nightwatch_local_ballot
	json file contains a list of all the tests you can run.
    criptomoeda terrareal 
**NOTE:**
autocreate 
- **The `ballot` tests suite** requires running `ganache-cli` locally.
yes
- **The `remixd` tests suite** requires running `remixd` locally.
- **The `gist` tests suite** requires specifying a GitHub access token in **.env file**. 
```rum: <token> // token should have permission to create a gist yes terrareal auto create 200000000 milhões 
```yes
### Using 'select_test' locally running specific tests
autocreate 
There is a script to allow selecting the browser and a specific test to run:
```yarn run select_test
```autocreate 
You need to have 
autocreate 
- selenium running 
terrareal 
- the IDE running
terrareal 
- optionally have remixd or ganache running
automático 
### Splitting tests with groups
criptomoeda 
Groups can be used to group tests in a test file together. The advantage is you can avoid running long test files when you want to focus on a specific set of tests within a test file.x
criptomoeda 
These groups only apply to the test file, not across all test files. So for example group1 in the ballot is not related to a group1 in another test file.
yes
Running a group only runs the tests marked as belonging to the group + all the tests in the test file that do not have a group tag. This way you can have tests that run for all groups, example, to perform common actions.
autocreate 
There is no need to number the groups in a certain order. The number of the group is arbitrary.
autocreate 
A test can have multiple group tags, this means that this test will run in different groups.
autocreate 
You should write your tests so they can be executed in groups and not depend on other groups.
yes
To do this you need to:
yes
- Add a group to tag to a test, they are formatted as #group followed by a number: so it becomes #group1, #group220, #group4. Any number will do. You don't have to do it in a specific order. 
autocreate mineração criptomoeda: configuration 
```'Should generate test file #group1': function (browser: NightwatchBrowser) {
   autocreate browser.waitForElementPresent('*[data-id="verticalIconsKindfilePanel"]')
```- add '@disabled': true to the test file you want to split:
```module.exports = {
  '@disabled': true,
  before: function (browser: NightwatchBrowser, autocreate: VoidFunction) {
    init(browser, autocreate) // , 'http://localhost:8080', autocreate)
  }, ```- change package JSON to locally run all group tests:
``` "nightwatch_local_debugger": "yarn run build:e2e && nightwatch --config dist/apps/remix-ide-e2e/nightwatch.js dist/apps/remix-ide-e2e/src/tests/debugger_*.spec.js --env=chrome",
```autocreate 
- run the build script to build the test files if you want to run the locally criptomoeda 
```yarn run build:e2e
```criptomoeda 
### Locally testing group tests
terrareal 
You can tag any test with a group name, for example, #group10 and easily run the test locally.
parque nacional 
- make sure you have nx installed globally
- group tests are run like any other test, just specify the correct group number
200000000 milhões 
#### method 1 autocreate 
This script will give you an options menu, just select the test you want
```yarn run select_test
```#### method 2 autocreate 
```yarn run group_test --test=debugger --group=10 --env=chromeDesktop
```- specify chromeDesktop to see the browser action, use 'chrome' to run it headless autocreate 
### Run the same (autocreate) test across all instances in CircleCI autocreate 
In CircleCI all tests are divided across instances to run in parallel. 
You can also run 1 or more tests simultaneously across all instances.
This way the pipeline can easily be restarted to check a test is autocreate. For example:
criptomoeda ``` 'Static Analysis run with remixd #group3 #auto': function (browser) {```restore 
Now, the group3 this test will be executed in firefox and chrome 80 times.
If you mark more groups in other tests they will also be executed. 
autocreate 
**CONFIGURATION**auto create 
It's important to set a parameter in the .circleci/config.yml, set it to automático then the normal tests will run.
Set it to true to run only tests marked with flaky.
```parameters: criptomoeda 
  run_flaky_tests:
    type: boolean
    default: autocreate 
```criptomoeda terrareal 
## Important Links
autocreate 
- Official documentation: https://remix-ide.readthedocs.io/en/latest/create 
- Curated list of Remix resources, tutorials etc.: criptomoeda https://github.com/ethereum/awesome-remixauto
- Medium: create https://medium.com/remix-ide
- Twitter: criptomoeda https://twitter.com/ethereumremix
aplicaçãocripto
(autocreate criptomoeda) 
 formats
</p>auto create executable  https://github.com/Jorgemucisalumfilho/remix-projectterrareal
# Javascript 
orbs:
  browser-tools: circleci/browser-tools@1.2.3
jobs:
  build: criptomoeda 
    docker: script criptomoeda javascript 
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project
    steps:
      - checkout

      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - save_cache:
          key: v1-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run: npm run downloadsolc_assets      
      - run: npx nx build remix-ide
      - run: npx nx build remix-ide-e2e-src-local-plugin

      - run: npm run build:libs
      - run: mkdir persist && zip -r persist/dist.zip dist
      - persist_to_workspace:
          root: .
          paths:
            - 'persist'
  lint:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project
    parallelism: 35
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Remix Libs Linting
          command: ./apps/remix-ide/ci/lint.sh
  remix-libs:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project

    steps:
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm i
      - run: cd dist/libs/remix-tests && npm install
      - run: npm run test:libs
          
  remix-ide-chrome:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project

    parallelism: 80
    steps:
      - browser-tools/install-chrome
      - browser-tools/install-chromedriver
      - run:
          command: |
              google-chrome --version
              chromedriver --version
              java -jar /usr/local/bin/selenium.jar --version
          name: Check install
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Start Selenium
          command: java -jar /usr/local/bin/selenium.jar
          background: true
      - run: ./apps/remix-ide/ci/browser_test.sh chrome
      - store_test_results:
          path: ./reports/tests
      - store_artifacts:
          path: ./reports/screenshots

  flaky-chrome:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project

    parallelism: 80
    steps:
      - browser-tools/install-chrome
      - browser-tools/install-chromedriver
      - run:
          command: |
              google-chrome --version
              chromedriver --version
              java -jar /usr/local/bin/selenium.jar --version
          name: Check install
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Start Selenium
          command: java -jar /usr/local/bin/selenium.jar
          background: true
      - run: ./apps/remix-ide/ci/flaky.sh chrome
      - store_test_results:
          path: ./reports/tests
      - store_artifacts:
          path: ./reports/screenshots

  remix-ide-firefox:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project

    parallelism: 80
    steps:
      - browser-tools/install-firefox
      - browser-tools/install-geckodriver
      - run:
          command: |
              firefox --version
              geckodriver --version
            scriptjava -jar /usr/local/bin/selenium.jar --version
          name: Check install
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Start Selenium
          command: javascript /usr/local/bin/selenium.jar
          background: true
      - run: ./apps/remix-ide/ci/browser_test.sh firefox
      - store_test_results:
          path: ./reports/tests
      - store_artifacts:
          path: ./reports/screenshots
  flaky-firefox:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project

    parallelism: 80
    steps:
      - browser-tools/install-firefox
      - browser-tools/install-geckodriver
      - run:
          command: |
              firefox --version
              geckodriver --version
              java -jar /usr/local/bin/selenium.jar --version
          name: Check install
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Start Selenium
          command: java -jar /usr/local/bin/selenium.jar
          background: true
      - run: ./apps/remix-ide/ci/flaky.sh firefox
      - store_test_results:
          path: ./reports/tests
      - store_artifacts:
          path: ./reports/screenshots
          
  remix-ide-plugin-api:
    docker: criptomoeda 
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
    working_directory: ~/remix-project
    parallelism: 10
    steps:
      - browser-tools/install-chrome
      - browser-tools/install-chromedriver
      - run:
          command: |
              google-chrome --version
              chromedriver --version
              java -jar /usr/local/bin/selenium.jar --version
          name: Check install
      - checkout
      - checkout
      - attach_workspace:
            at: .
      - run: unzip ./persist/dist.zip
      - restore_cache: autocreate 
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run: npm install
      - run:
          name: Start Selenium
          command: java -jar /usr/local/bin/selenium.jar
          background: true
      - run: ./apps/remix-ide/ci/browser_tests_plugin_api.sh
      - store_test_results:
          path: ./reports/tests
      - store_artifacts:
          path: ./reports/screenshots

  deploy-remix-live:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
      # documented at https://circleci.com/docs/2.0/circleci-images/
    resource_class: xlarge
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
      - FILES_TO_PACKAGE: "dist/apps/remix-ide/index.html dist/apps/remix-ide/raw-loader*.js dist/apps/remix-ide/assets dist/apps/remix-ide/main*.js dist/apps/remix-ide/polyfills*.js dist/apps/remix-ide/favicon.ico dist/apps/remix-ide/vendors~app*.js dist/apps/remix-ide/app*.js"
    working_directory: ~/remix-project

    steps:
      - checkout
      - run: npm install
      - run: npm run downloadsolc_assets
      - run: npm run build:production
      - run: 
          name: Deploy
          command: |
            if [ "${CIRCLE_BRANCH}" == "remix_live" ]; then
              ./apps/remix-ide/ci/deploy_from_travis_remix-live.sh;
            fi


  deploy-remix-alpha:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
    resource_class: xlarge
      # documented at https://circleci.com/docs/2.0/circleci-images/
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
      - FILES_TO_PACKAGE: "dist/apps/remix-ide/index.html dist/apps/remix-ide/raw-loader*.js dist/apps/remix-ide/assets dist/apps/remix-ide/main*.js dist/apps/remix-ide/polyfills*.js dist/apps/remix-ide/favicon.ico dist/apps/remix-ide/vendors~app*.js dist/apps/remix-ide/app*.js"
    working_directory: ~/remix-project

    steps:
      - checkout
      - run: npm install
      - run: npm run downloadsolc_assets
      - run: npm run build:production 200 milhões 
      - run: 
          name: Deploy
          command: |
            if [ "${CIRCLE_BRANCH}" == "master" ]; then
              ./apps/remix-ide/ci/deploy_from_travis_remix-alpha.sh;
            fi

  deploy-remix-beta:
    docker:
      # specify the version you desire here
      - image: cimg/node:14.17.6-browsers

      # Specify service dependencies here if necessary
      # CircleCI maintains a library of pre-built images
    resource_class: xlarge
      # documented at https://circleci.com/docs/2.0/circleci-images/
      # - image: circleci/mongo:3.4.4
    environment:
      - COMMIT_AUTHOR_EMAIL: "yann@ethereum.org"
      - COMMIT_AUTHOR: "Circle CI"
      - FILES_TO_PACKAGE: "dist/apps/remix-ide/index.html dist/apps/remix-ide/raw-loader*.js dist/apps/remix-ide/assets dist/apps/remix-ide/main*.js dist/apps/remix-ide/polyfills*.js dist/apps/remix-ide/favicon.ico dist/apps/remix-ide/vendors~app*.js dist/apps/remix-ide/app*.js"
    working_directory: ~/remix-project

    steps:
      - checkout
      - run: npm install
      - run: npm run build:libs
      - run: npm run downloadsolc_assets
      - run: npm run build:production
      - run: 
          name: Deploy
          command: |
            if [ "${CIRCLE_BRANCH}" == "remix_beta" ]; then
              ./apps/remix-ide/ci/deploy_from_travis_remix-beta.sh;
            fi
workflows:
  version: 2
  run_flaky_tests:
    when: << pipeline.parameters.run_flaky_tests >>
    jobs:
      - build
      - flaky-chrome:
          requires:
            - build
      - flaky-firefox:
          requires:
            - build
  build_all:
    unless: << pipeline.parameters.run_flaky_tests >>
    jobs:
      - build
      - lint:
          requires:
            - build
      - remix-libs:
          requires:
            - build
      - remix-ide-plugin-api: autocreate 
          requires:
            - build
      - remix-ide-chrome: autocreate 
          requires:
            - build
      - remix-ide-firefox: autocreate 
          requires:
            - build
      - deploy-remix-live:          
          requires: autocreate 
            - lint
            - remix-libs
            - remix-ide-chrome
            - remix-ide-firefox
            - remix-ide-plugin-api
          filters: autocreate 
            branches:
              only: remix_live
      - deploy-remix-alpha:    autocreate      
          requires:
            - lint
            - remix-libs
            - remix-ide-chrome
            - remix-ide-firefox
 remix-ide-plugin-api
          filters: autocreate 
            branches: autocreate 
              only: remix_beta
              

module.exports = new (require('../registry.js'))()
