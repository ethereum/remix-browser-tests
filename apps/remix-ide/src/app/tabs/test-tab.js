import { ViewPlugin } from '@remixproject/engine-web'
import { removeMultipleSlashes, removeTrailingSlashes } from '../../lib/helper'
import { canUseWorker, urlFromVersion } from '@remix-project/remix-solidity'
import { format } from 'util'
var yo = require('yo-yo')
var async = require('async')
var tooltip = require('../ui/tooltip')
var Renderer = require('../ui/renderer')
var css = require('./styles/test-tab-styles')
var remixTests = require('@remix-project/remix-tests')

const TestTabLogic = require('./testTab/testTab')

const profile = {
  name: 'solidityUnitTesting',
  displayName: 'Solidity unit testing',
  methods: ['testFromPath', 'testFromSource', 'setTestFolderPath'],
  events: [],
  icon: 'assets/img/unitTesting.webp',
  description: 'Fast tool to generate unit tests for your contracts',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/unittesting.html'
}

module.exports = class TestTab extends ViewPlugin {
  constructor (fileManager, offsetToLineColumnConverter, filePanel, compileTab, appManager, contentImport) {
    super(profile)
    this.compileTab = compileTab
    this.contentImport = contentImport
    this._view = { el: null }
    this.fileManager = fileManager
    this.filePanel = filePanel
    this.data = {}
    this.appManager = appManager
    this.renderer = new Renderer(this)
    this.hasBeenStopped = false
    this.runningTestsNumber = 0
    this.readyTestsNumber = 0
    this.areTestsRunning = false
    this.defaultPath = 'tests'
    this.offsetToLineColumnConverter = offsetToLineColumnConverter

    appManager.event.on('activate', (name) => {
      if (name === 'solidity') this.updateRunAction()
    })
    appManager.event.on('deactivate', (name) => {
      if (name === 'solidity') this.updateRunAction()
    })
  }

  onActivationInternal () {
    this.testTabLogic = new TestTabLogic(this.fileManager)
    this.listenToEvents()
    this.call('filePanel', 'registerContextMenuItem', {
      id: 'solidityUnitTesting',
      name: 'setTestFolderPath',
      label: 'Set path for Unit Testing',
      type: ['folder'],
      extension: [],
      path: [],
      pattern: []
    })
  }

  async setTestFolderPath (event) {
    if (event.path.length > 0) {
      await this.setCurrentPath(event.path[0])
    }
  }

  onDeactivation () {
    this.off('filePanel', 'newTestFileCreated')
    this.off('filePanel', 'setWorkspace')
    this.fileManager.events.removeListener('currentFileChanged', this.updateForNewCurrent)
  }

  listenToEvents () {
    this.on('filePanel', 'newTestFileCreated', async file => {
      try {
        await this.testTabLogic.getTests((error, tests) => {
          if (error) return tooltip(error)
          this.data.allTests = tests
          this.data.selectedTests = [...this.data.allTests]
          this.updateTestFileList(tests)
          if (!this.testsOutput) return // eslint-disable-line
        })
      } catch (e) {
        console.log(e)
        this.data.allTests.push(file)
        this.data.selectedTests.push(file)
      }
    })

    this.on('filePanel', 'setWorkspace', async () => {
      this.setCurrentPath(this.defaultPath)
    })

    this.fileManager.events.on('noFileSelected', () => {
    })

    this.fileManager.events.on('currentFileChanged', (file, provider) => this.updateForNewCurrent(file))
  }

  async updateForNewCurrent (file) {
    this.data.allTests = []
    this.updateTestFileList()
    this.clearResults()
    this.updateGenerateFileAction()
    if (!this.areTestsRunning) this.updateRunAction(file)
    try {
      await this.testTabLogic.getTests((error, tests) => {
        if (error) return tooltip(error)
        this.data.allTests = tests
        this.data.selectedTests = [...this.data.allTests]
        this.updateTestFileList(tests)
        if (!this.testsOutput) return // eslint-disable-line
      })
    } catch (e) {
      console.log(e)
    }
  }

  createSingleTest (testFile) {
    return yo`
      <div class="d-flex align-items-center py-1">
        <input class="singleTest" id="singleTest${testFile}" onchange=${(e) => this.toggleCheckbox(e.target.checked, testFile)} type="checkbox" checked="true">
        <label class="singleTestLabel text-nowrap pl-2 mb-0" for="singleTest${testFile}">${testFile}</label>
      </div>
    `
  }

  listTests () {
    if (!this.data.allTests || !this.data.allTests.length) return []
    return this.data.allTests.map(
      testFile => this.createSingleTest(testFile)
    )
  }

  toggleCheckbox (eChecked, test) {
    if (!this.data.selectedTests) {
      this.data.selectedTests = this._view.el.querySelectorAll('.singleTest:checked')
    }
    let selectedTests = this.data.selectedTests
    selectedTests = eChecked ? [...selectedTests, test] : selectedTests.filter(el => el !== test)
    this.data.selectedTests = selectedTests
    const checkAll = this._view.el.querySelector('[id="checkAllTests"]')
    const runBtn = document.getElementById('runTestsTabRunAction')

    if (eChecked) {
      checkAll.checked = true
      const stopBtnInnerText = document.getElementById('runTestsTabStopAction').innerText
      if ((this.readyTestsNumber === this.runningTestsNumber || this.hasBeenStopped) && stopBtnInnerText.trim() === 'Stop') {
        runBtn.removeAttribute('disabled')
        runBtn.setAttribute('title', 'Run tests')
      }
    } else if (!selectedTests.length) {
      checkAll.checked = false
      runBtn.setAttribute('disabled', 'disabled')
      runBtn.setAttribute('title', 'No test file selected')
    }
  }

  checkAll (event) {
    const checkBoxes = this._view.el.querySelectorAll('.singleTest')
    const checkboxesLabels = this._view.el.querySelectorAll('.singleTestLabel')
    // checks/unchecks all
    for (let i = 0; i < checkBoxes.length; i++) {
      checkBoxes[i].checked = event.target.checked
      this.toggleCheckbox(event.target.checked, checkboxesLabels[i].innerText)
    }
  }

  async discardHighlight () {
    await this.call('editor', 'discardHighlight')
  }

  async highlightLocation (location, runningTests, fileName) {
    if (location) {
      var split = location.split(':')
      var file = split[2]
      location = {
        start: parseInt(split[0]),
        length: parseInt(split[1])
      }
      location = this.offsetToLineColumnConverter.offsetToLineColumnWithContent(
        location,
        parseInt(file),
        runningTests[fileName].content
      )
      await this.call('editor', 'discardHighlight')
      await this.call('editor', 'highlight', location, fileName)
    }
  }

  printHHLogs (logsArr, testName) {
    let finalLogs = `<b>${testName}:</b>\n`
    for (const log of logsArr) {
      let formattedLog
      // Hardhat implements the same formatting options that can be found in Node.js' console.log,
      // which in turn uses util.format: https://nodejs.org/dist/latest-v12.x/docs/api/util.html#util_util_format_format_args
      // For example: console.log("Name: %s, Age: %d", remix, 6) will log 'Name: remix, Age: 6'
      // We check first arg to determine if 'util.format' is needed
      if (typeof log[0] === 'string' && (log[0].includes('%s') || log[0].includes('%d'))) {
        formattedLog = format(log[0], ...log.slice(1))
      } else {
        formattedLog = log.join(' ')
      }
      finalLogs = finalLogs + '&emsp;' + formattedLog + '\n'
    }
    this.call('terminal', 'log', { type: 'info', value: finalLogs })
  }

  testCallback (result, runningTests) {
    this.testsOutput.hidden = false
    if (result.type === 'contract') {
      this.testSuite = result.value
      if (this.testSuites) {
        this.testSuites.push(this.testSuite)
      } else {
        this.testSuites = [this.testSuite]
      }
      this.rawFileName = result.filename
      this.runningTestFileName = this.cleanFileName(this.rawFileName, this.testSuite)
      this.outputHeader = yo`
        <div id="${this.runningTestFileName}" data-id="testTabSolidityUnitTestsOutputheader" class="pt-1">
          <span class="font-weight-bold">${this.testSuite} (${this.rawFileName})</span>
        </div>
      `
      this.testsOutput.appendChild(this.outputHeader)
    } else if (result.type === 'testPass') {
      if (result.hhLogs && result.hhLogs.length) this.printHHLogs(result.hhLogs, result.value)
      this.testsOutput.appendChild(yo`
        <div
          id="${this.runningTestFileName}"
          data-id="testTabSolidityUnitTestsOutputheader"
          class="${css.testPass} ${css.testLog} bg-light mb-2 text-success border-0"
          onclick=${() => this.discardHighlight()}
        >
          ✓ ${result.value}
        </div>
      `)
    } else if (result.type === 'testFailure') {
      if (result.hhLogs && result.hhLogs.length) this.printHHLogs(result.hhLogs, result.value)
      if (!result.assertMethod) {
        this.testsOutput.appendChild(yo`
        <div
          class="bg-light mb-2 ${css.testFailure} ${css.testLog} d-flex flex-column text-danger border-0"
          id="UTContext${result.context}"
          onclick=${() => this.highlightLocation(result.location, runningTests, result.filename)}
        >
          <span> ✘ ${result.value}</span>
          <span class="text-dark">Error Message:</span>
          <span class="pb-2 text-break">"${result.errMsg}"</span>
        </div>
      `)
      } else {
        const preposition = result.assertMethod === 'equal' || result.assertMethod === 'notEqual' ? 'to' : ''
        const method = result.assertMethod === 'ok' ? '' : result.assertMethod
        const expected = result.assertMethod === 'ok' ? '\'true\'' : result.expected
        this.testsOutput.appendChild(yo`
          <div
            class="bg-light mb-2 ${css.testFailure} ${css.testLog} d-flex flex-column text-danger border-0"
            id="UTContext${result.context}"
            onclick=${() => this.highlightLocation(result.location, runningTests, result.filename)}
          >
            <span> ✘ ${result.value}</span>
            <span class="text-dark">Error Message:</span>
            <span class="pb-2 text-break">"${result.errMsg}"</span>
            <span class="text-dark">Assertion:</span>
            <div class="d-flex flex-wrap">
              <span>Expected value should be</span>
              <div class="mx-1 font-weight-bold">${method}</div>
              <div>${preposition} ${expected}</div>
            </div>
            <span class="text-dark">Received value:</span>
            <span>${result.returned}</span>
            <span class="text-dark text-sm pb-2">Skipping the remaining tests of the function.</span>
          </div>
        `)
      }
    }
  }

  resultsCallback (_err, result, cb) {
    // total stats for the test
    // result.passingNum
    // result.failureNum
    // result.timePassed
    cb()
  }

  cleanFileName (fileName, testSuite) {
    return fileName ? fileName.replace(/\//g, '_').replace(/\./g, '_') + testSuite : fileName
  }

  setHeader (status) {
    if (status) {
      const label = yo`
        <div
          class="alert-success d-inline-block mb-1 mr-1 p-1 passed_${this.runningTestFileName}"
          title="All contract tests passed"
        >
          PASS
        </div>
      `

      this.outputHeader && yo.update(this.outputHeader, yo`
        <div id="${this.runningTestFileName}" data-id="testTabSolidityUnitTestsOutputheader" class="pt-1">
          ${label} <span class="font-weight-bold">${this.testSuite} (${this.rawFileName})</span>
        </div>
      `)
    } else {
      const label = yo`
        <div
          class="alert-danger d-inline-block mb-1 mr-1 p-1 failed_${this.runningTestFileName}"
          title="At least one contract test failed"
        >
          FAIL
        </div>
      `

      this.outputHeader && yo.update(this.outputHeader, yo`
        <div id="${this.runningTestFileName}"  data-id="testTabSolidityUnitTestsOutputheader" class="pt-1">
          ${label} <span class="font-weight-bold">${this.testSuite} (${this.rawFileName})</span>
        </div>
      `)
    }
  }

  updateFinalResult (_errors, result, filename) {
    ++this.readyTestsNumber
    this.testsOutput.hidden = false
    if (!result && (_errors && (_errors.errors || (Array.isArray(_errors) && (_errors[0].message || _errors[0].formattedMessage))))) {
      this.testCallback({ type: 'contract', filename })
      this.setHeader(false)
    }
    if (_errors && _errors.errors) {
      _errors.errors.forEach((err) => this.renderer.error(err.formattedMessage || err.message, this.testsOutput, { type: err.severity }))
    } else if (_errors && Array.isArray(_errors) && (_errors[0].message || _errors[0].formattedMessage)) {
      _errors.forEach((err) => this.renderer.error(err.formattedMessage || err.message, this.testsOutput, { type: err.severity }))
    } else if (_errors && !_errors.errors && !Array.isArray(_errors)) {
      // To track error like this: https://github.com/ethereum/remix/pull/1438
      this.renderer.error(_errors.formattedMessage || _errors.message, this.testsOutput, { type: 'error' })
    }
    yo.update(this.resultStatistics, this.createResultLabel())
    if (result) {
      const totalTime = parseFloat(result.totalTime).toFixed(2)

      if (result.totalPassing > 0 && result.totalFailing > 0) {
        this.testsOutput.appendChild(yo`
          <div class="d-flex alert-secondary mb-3 p-3 flex-column">
            <span class="font-weight-bold">Result for ${filename}</span>
            <span class="text-success">Passing: ${result.totalPassing}</span>
            <span class="text-danger">Failing: ${result.totalFailing}</span>
            <span>Total time: ${totalTime}s</span>
          </div>
        `)
      } else if (result.totalPassing > 0 && result.totalFailing <= 0) {
        this.testsOutput.appendChild(yo`
          <div class="d-flex alert-secondary mb-3 p-3 flex-column">
            <span class="font-weight-bold">Result for ${filename}</span>
            <span class="text-success">Passing: ${result.totalPassing}</span>
            <span>Total time: ${totalTime}s</span>
          </div>
        `)
      } else if (result.totalPassing <= 0 && result.totalFailing > 0) {
        this.testsOutput.appendChild(yo`
          <div class="d-flex alert-secondary mb-3 p-3 flex-column">
            <span class="font-weight-bold">Result for ${filename}</span>
            <span class="text-danger">Failing: ${result.totalFailing}</span>
            <span>Total time: ${totalTime}s</span>
          </div>
        `)
      }
      // fix for displaying right label for multiple tests (testsuites) in a single file
      this.testSuites.forEach(testSuite => {
        this.testSuite = testSuite
        this.runningTestFileName = this.cleanFileName(filename, this.testSuite)
        this.outputHeader = document.querySelector(`#${this.runningTestFileName}`)
        this.setHeader(true)
      })

      result.errors.forEach((error, index) => {
        this.testSuite = error.context
        this.runningTestFileName = this.cleanFileName(filename, error.context)
        this.outputHeader = document.querySelector(`#${this.runningTestFileName}`)
        const isFailingLabel = document.querySelector(`.failed_${this.runningTestFileName}`)
        if (!isFailingLabel) this.setHeader(false)
      })
      this.testsOutput.appendChild(yo`
        <div>
          <p class="text-info mb-2 border-top m-0"></p>
        </div>
      `)
    }
    if (this.hasBeenStopped && (this.readyTestsNumber !== this.runningTestsNumber)) {
      // if all tests has been through before stopping no need to print this.
      this.testsExecutionStopped.hidden = false
    }
    if (_errors) this.testsExecutionStoppedError.hidden = false
    if (_errors || this.hasBeenStopped || this.readyTestsNumber === this.runningTestsNumber) {
      // All tests are ready or the operation has been canceled or there was a compilation error in one of the test files.
      const stopBtn = document.getElementById('runTestsTabStopAction')
      stopBtn.setAttribute('disabled', 'disabled')
      const stopBtnLabel = document.getElementById('runTestsTabStopActionLabel')
      stopBtnLabel.innerText = 'Stop'
      if (this.data.selectedTests.length !== 0) {
        const runBtn = document.getElementById('runTestsTabRunAction')
        runBtn.removeAttribute('disabled')
      }
      this.areTestsRunning = false
    }
  }

  async testFromPath (path) {
    const fileContent = await this.fileManager.readFile(path)
    return this.testFromSource(fileContent, path)
  }

  /**
   * Changes the current path of Unit Testing Plugin
   * @param path - the path from where UT plugin takes _test.sol files to run
   */
  async setCurrentPath (path) {
    this.testTabLogic.setCurrentPath(path)
    this.inputPath.value = path
    this.updateDirList(path)
    await this.updateForNewCurrent()
  }

  /*
    Test is not associated with the UI
  */
  testFromSource (content, path = 'browser/unit_test.sol') {
    return new Promise((resolve, reject) => {
      const runningTest = {}
      runningTest[path] = { content }
      const { currentVersion, evmVersion, optimize, runs } = this.compileTab.getCurrentCompilerConfig()
      const currentCompilerUrl = urlFromVersion(currentVersion)
      const compilerConfig = {
        currentCompilerUrl,
        evmVersion,
        optimize,
        usingWorker: canUseWorker(currentVersion),
        runs
      }
      remixTests.runTestSources(runningTest, compilerConfig, () => {}, () => {}, (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }, (url, cb) => {
        return this.contentImport.resolveAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message))
      })
    })
  }

  runTest (testFilePath, callback) {
    if (this.hasBeenStopped) {
      this.updateFinalResult()
      return
    }
    this.resultStatistics.hidden = false
    this.fileManager.readFile(testFilePath).then((content) => {
      const runningTests = {}
      runningTests[testFilePath] = { content }
      const { currentVersion, evmVersion, optimize, runs } = this.compileTab.getCurrentCompilerConfig()
      const currentCompilerUrl = urlFromVersion(currentVersion)
      const compilerConfig = {
        currentCompilerUrl,
        evmVersion,
        optimize,
        usingWorker: canUseWorker(currentVersion),
        runs
      }
      remixTests.runTestSources(
        runningTests,
        compilerConfig,
        (result) => this.testCallback(result, runningTests),
        (_err, result, cb) => this.resultsCallback(_err, result, cb),
        (error, result) => {
          this.updateFinalResult(error, result, testFilePath)
          callback(error)
        }, (url, cb) => {
          return this.contentImport.resolveAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message))
        }
      )
    }).catch((error) => {
      if (error) return // eslint-disable-line
    })
  }

  handleCreateFolder () {
    this.inputPath.value = this.trimTestDirInput(this.inputPath.value)
    let path = removeMultipleSlashes(this.inputPath.value)
    if (path !== '/') path = removeTrailingSlashes(path)
    if (this.inputPath.value === '') this.inputPath.value = this.defaultPath
    this.inputPath.value = path
    this.testTabLogic.generateTestFolder(this.inputPath.value)
    this.createTestFolder.disabled = true
    this.updateGenerateFileAction().disabled = false
    this.testTabLogic.setCurrentPath(this.inputPath.value)
    this.updateRunAction()
    this.updateForNewCurrent()
    this.uiPathList.appendChild(yo`<option>${this.inputPath.value}</option>`)
  }

  clearResults () {
    yo.update(this.resultStatistics, yo`<span></span>`)
    this.call('editor', 'clearAnnotations')
    this.testsOutput.innerHTML = ''
    this.testsOutput.hidden = true
    this.testsExecutionStopped.hidden = true
    this.testsExecutionStoppedError.hidden = true
  }

  runTests () {
    this.areTestsRunning = true
    this.hasBeenStopped = false
    this.readyTestsNumber = 0
    this.runningTestsNumber = this.data.selectedTests.length
    const stopBtn = document.getElementById('runTestsTabStopAction')
    stopBtn.removeAttribute('disabled')
    const runBtn = document.getElementById('runTestsTabRunAction')
    runBtn.setAttribute('disabled', 'disabled')
    this.clearResults()
    yo.update(this.resultStatistics, this.createResultLabel())
    const tests = this.data.selectedTests
    if (!tests) return
    this.resultStatistics.hidden = tests.length === 0
    async.eachOfSeries(tests, (value, key, callback) => {
      if (this.hasBeenStopped) return
      this.runTest(value, callback)
    })
  }

  stopTests () {
    this.hasBeenStopped = true
    const stopBtnLabel = document.getElementById('runTestsTabStopActionLabel')
    stopBtnLabel.innerText = 'Stopping'
    const stopBtn = document.getElementById('runTestsTabStopAction')
    stopBtn.setAttribute('disabled', 'disabled')
    const runBtn = document.getElementById('runTestsTabRunAction')
    runBtn.setAttribute('disabled', 'disabled')
  }

  updateGenerateFileAction () {
    const el = yo`
      <button
        class="btn border w-50"
        data-id="testTabGenerateTestFile"
        title="Generate sample test file."
        onclick="${this.testTabLogic.generateTestFile.bind(this.testTabLogic)}"
      >
        Generate
      </button>
    `
    if (!this.generateFileActionElement) {
      this.generateFileActionElement = el
    } else {
      yo.update(this.generateFileActionElement, el)
    }
    return this.generateFileActionElement
  }

  updateRunAction (currentFile) {
    const el = yo`
      <button id="runTestsTabRunAction" title="Run tests" data-id="testTabRunTestsTabRunAction" class="w-50 btn btn-primary" onclick="${() => this.runTests()}">
        <span class="fas fa-play ml-2"></span>
        <label class="${css.labelOnBtn} btn btn-primary p-1 ml-2 m-0">Run</label>
      </button>
    `
    const isSolidityActive = this.appManager.isActive('solidity')
    if (!isSolidityActive || !this.listTests().length) {
      el.setAttribute('disabled', 'disabled')
      if (!currentFile || (currentFile && currentFile.split('.').pop().toLowerCase() !== 'sol')) {
        el.setAttribute('title', 'No solidity file selected')
      } else {
        el.setAttribute('title', 'The "Solidity Plugin" should be activated')
        // @todo(#2747)  we can activate the plugin here
      }
    }
    if (!this.runActionElement) {
      this.runActionElement = el
    } else {
      yo.update(this.runActionElement, el)
    }
    return this.runActionElement
  }

  updateStopAction () {
    return yo`
      <button id="runTestsTabStopAction" data-id="testTabRunTestsTabStopAction" class="w-50 pl-2 ml-2 btn btn-secondary" disabled="disabled" title="Stop running tests" onclick=${() => this.stopTests()}">
        <span class="fas fa-stop ml-2"></span>
        <label class="${css.labelOnBtn} btn btn-secondary p-1 ml-2 m-0" id="runTestsTabStopActionLabel">Stop</label>
      </button>
    `
  }

  updateTestFileList (tests) {
    const testsMessage = (tests && tests.length ? this.listTests() : 'No test file available')
    const el = yo`<div class="${css.testList} py-2 mt-0 border-bottom">${testsMessage}</div>`
    if (!this.testFilesListElement) {
      this.testFilesListElement = el
    } else {
      yo.update(this.testFilesListElement, el)
    }
    this.updateRunAction()
    return this.testFilesListElement
  }

  selectAll () {
    return yo`
      <div class="d-flex align-items-center mx-3 pb-2 mt-2 border-bottom">
        <input id="checkAllTests"
          type="checkbox"
          data-id="testTabCheckAllTests"
          onclick="${(event) => { this.checkAll(event) }}"
          checked="true"
        >
        <label class="text-nowrap pl-2 mb-0" for="checkAllTests"> Select all </label>
      </div>
    `
  }

  infoButton () {
    return yo`
      <a class="btn border text-decoration-none pr-0 d-flex w-50 ml-2" title="Check out documentation." target="__blank" href="https://remix-ide.readthedocs.io/en/latest/unittesting.html#test-directory">
        <label class="btn p-1 ml-2 m-0">How to use...</label>
      </a>
    `
  }

  createResultLabel () {
    if (!this.data.selectedTests) return yo`<span></span>`
    const ready = this.readyTestsNumber ? `${this.readyTestsNumber}` : '0'
    return yo`<span class='text-info h6'>Progress: ${ready} finished (of ${this.runningTestsNumber})</span>`
  }

  updateDirList (path) {
    for (const o of this.uiPathList.querySelectorAll('option')) o.remove()
    this.testTabLogic.dirList(path).then((options) => {
      options.forEach((path) => this.uiPathList.appendChild(yo`<option>${path}</option>`))
    })
  }

  trimTestDirInput (input) {
    if (input.includes('/')) return input.split('/').map(e => e.trim()).join('/')
    else return input.trim()
  }

  pathAdded (text) {
    for (const option of this.uiPathList.querySelectorAll('option')) {
      if (option.innerHTML === text) return true
    }
    return false
  }

  async handleTestDirInput (e) {
    let testDirInput = this.trimTestDirInput(this.inputPath.value)
    testDirInput = removeMultipleSlashes(testDirInput)
    if (testDirInput !== '/') testDirInput = removeTrailingSlashes(testDirInput)
    if (e.key === 'Enter') {
      this.inputPath.value = testDirInput
      if (await this.testTabLogic.pathExists(testDirInput)) {
        this.testTabLogic.setCurrentPath(testDirInput)
        this.updateForNewCurrent()
        return
      }
    }

    if (testDirInput) {
      if (testDirInput.endsWith('/') && testDirInput !== '/') {
        testDirInput = removeTrailingSlashes(testDirInput)
        if (this.testTabLogic.currentPath === testDirInput.substr(0, testDirInput.length - 1)) {
          this.createTestFolder.disabled = true
          this.updateGenerateFileAction().disabled = true
        }
        this.updateDirList(testDirInput)
      } else {
        // If there is no matching folder in the workspace with entered text, enable Create button
        if (await this.testTabLogic.pathExists(testDirInput)) {
          this.createTestFolder.disabled = true
          this.updateGenerateFileAction().disabled = false
        } else {
          // Enable Create button
          this.createTestFolder.disabled = false
          // Disable Generate button because dir does not exist
          this.updateGenerateFileAction().disabled = true
        }
      }
    } else {
      this.updateDirList('/')
    }
  }

  async handleEnter (e) {
    this.inputPath.value = removeMultipleSlashes(this.trimTestDirInput(this.inputPath.value))
    if (this.createTestFolder.disabled) {
      if (await this.testTabLogic.pathExists(this.inputPath.value)) {
        this.testTabLogic.setCurrentPath(this.inputPath.value)
        this.updateForNewCurrent()
      }
    }
  }

  render () {
    this.onActivationInternal()
    this.testsOutput = yo`<div class="mx-3 mb-2 pb-4 border-top border-primary" hidden='true' id="solidityUnittestsOutput" data-id="testTabSolidityUnitTestsOutput"></a>`
    this.testsExecutionStopped = yo`<label class="text-warning h6" data-id="testTabTestsExecutionStopped">The test execution has been stopped</label>`
    this.testsExecutionStoppedError = yo`<label class="text-danger h6" data-id="testTabTestsExecutionStoppedError">The test execution has been stopped because of error(s) in your test file</label>`
    this.uiPathList = yo`<datalist id="utPathList"></datalist>`
    this.inputPath = yo`<input
      placeholder=${this.defaultPath}
      list="utPathList"
      class="${css.inputFolder} custom-select"
      id="utPath"
      data-id="uiPathInput"
      name="utPath"
      title="Press 'Enter' to change the path for test files."
      style="background-image: var(--primary);"
      onkeyup=${(e) => this.handleTestDirInput(e)}
      onchange=${async (e) => this.handleEnter(e)}
    />`

    this.createTestFolder = yo`
      <button
        class="btn border ml-2"
        data-id="testTabGenerateTestFolder"
        title="Create a test folder"
        disabled=true
        onclick=${(e) => this.handleCreateFolder()}
      >
        Create
      </button>
    `

    const availablePaths = yo`
      <div>
        <div class="d-flex p-2">
          ${this.inputPath}
          ${this.createTestFolder}
          ${this.uiPathList}
        </div>
      </div>
    `
    this.updateDirList('/')
    this.testsExecutionStopped.hidden = true
    this.testsExecutionStoppedError.hidden = true
    this.resultStatistics = this.createResultLabel()
    this.resultStatistics.hidden = true
    const el = yo`
      <div class="${css.testTabView} px-2" id="testView">
        <div class="${css.infoBox}">
          <p class="text-lg"> Test your smart contract in Solidity.</p>
          <p> Select directory to load and generate test files.</p>
          <label>Test directory:</label>
          ${availablePaths}
        </div>
        <div class="${css.tests}">          
          <div class="d-flex p-2">
           ${this.updateGenerateFileAction()}
           ${this.infoButton()}
          </div>
          <div class="d-flex p-2">
            ${this.updateRunAction()}
            ${this.updateStopAction()}
          </div>
          ${this.selectAll()}
          ${this.updateTestFileList()}
          <div class="align-items-start flex-column mt-2 mx-3 mb-0">
            ${this.resultStatistics}
            ${this.testsExecutionStopped}
            ${this.testsExecutionStoppedError}
          </div>
          ${this.testsOutput}
        </div>
      </div>
    `
    this._view.el = el
    this.testTabLogic.setCurrentPath(this.defaultPath)
    this.updateForNewCurrent(this.fileManager.currentFile())
    return el
  }
}
