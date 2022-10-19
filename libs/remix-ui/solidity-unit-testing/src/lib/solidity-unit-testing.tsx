import React, { useState, useRef, useEffect, ReactElement } from 'react' // eslint-disable-line
import * as semver from 'semver'
import { eachOfSeries } from 'async' // eslint-disable-line
import type Web3 from 'web3'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { canUseWorker, urlFromVersion } from '@remix-project/remix-solidity'
import { Renderer } from '@remix-ui/renderer' // eslint-disable-line
import { Toaster } from '@remix-ui/toaster' // eslint-disable-line
import { format } from 'util'
import './css/style.css'

const _paq = (window as any)._paq = (window as any)._paq || [] // eslint-disable-line @typescript-eslint/no-explicit-any

interface TestObject {
  fileName: string
  checked: boolean
}

interface TestResultInterface {
  type: string
  value: any  // eslint-disable-line @typescript-eslint/no-explicit-any
  time?: number
  context?: string
  errMsg?: string
  filename: string
  assertMethod?: string
  returned?: string | number
  expected?: string | number
  location?: string
  hhLogs?: []
  web3?: Web3
  debugTxHash?: string
  rendered?: boolean
}

interface FinalResult {
  totalPassing: number,
  totalFailing: number,
  totalTime: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  errors: any[],  // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const SolidityUnitTesting = (props: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any

  const { helper, testTab, initialPath } = props
  const { testTabLogic } = testTab

  const [toasterMsg, setToasterMsg] = useState<string>('')

  const [disableCreateButton, setDisableCreateButton] = useState<boolean>(true)
  const [disableGenerateButton, setDisableGenerateButton] = useState<boolean>(false)
  const [disableStopButton, setDisableStopButton] = useState<boolean>(true)
  const [disableRunButton, setDisableRunButton] = useState<boolean>(false)
  const [runButtonTitle, setRunButtonTitle] = useState<string>('Run tests')
  const [stopButtonLabel, setStopButtonLabel] = useState<string>('Stop')

  const [checkSelectAll, setCheckSelectAll] = useState<boolean>(true)
  const [testsOutput, setTestsOutput] = useState<ReactElement[]>([])

  const [testsExecutionStoppedHidden, setTestsExecutionStoppedHidden] = useState<boolean>(true)
  const [progressBarHidden, setProgressBarHidden] = useState<boolean>(true)
  const [testsExecutionStoppedErrorHidden, setTestsExecutionStoppedErrorHidden] = useState<boolean>(true)

  let [testFiles, setTestFiles] = useState<TestObject[]>([]) // eslint-disable-line
  const [pathOptions, setPathOptions] = useState<string[]>([''])

  const [inputPathValue, setInputPathValue] = useState<string>('tests')

  let [readyTestsNumber, setReadyTestsNumber] = useState<number>(0) // eslint-disable-line
  let [runningTestsNumber, setRunningTestsNumber] = useState<number>(0) // eslint-disable-line

  const areTestsRunning = useRef<boolean>(false)
  const hasBeenStopped = useRef<boolean>(false)
  const isDebugging = useRef<boolean>(false)
  const allTests = useRef<string[]>([])
  const selectedTests = useRef<string[]>([])
  const currentTestFiles:any = useRef([]) // stores files for which tests have been run
  const currentErrors:any = useRef([]) // eslint-disable-line @typescript-eslint/no-explicit-any

  const defaultPath = 'tests'

  let runningTestFileName: string
  const filesContent: Record<string, Record<string, string>> = {}
  const testsResultByFilename: Record<string, Record<string, Record<string, any>>> = {} // eslint-disable-line @typescript-eslint/no-explicit-any

  const trimTestDirInput = (input: string) => {
    if (input.includes('/')) return input.split('/').map(e => e.trim()).join('/')
    else return input.trim()
  }

  const clearResults = () => {
    setProgressBarHidden(true)
    testTab.call('editor', 'clearAnnotations')
    setTestsOutput([])
    setTestsExecutionStoppedHidden(true)
    setTestsExecutionStoppedErrorHidden(true)
  }

  const updateForNewCurrent = async (file: string | null = null) => {
    // Ensure that when someone clicks on compilation error and that opens a new file
    // Test result, which is compilation error in this case, is not cleared
    if (currentErrors.current) {
      if (Array.isArray(currentErrors.current) && currentErrors.current.length > 0) {
        const errFiles = currentErrors.current.map((err:any) => { if (err.sourceLocation && err.sourceLocation.file) return err.sourceLocation.file }) // eslint-disable-line
        if (errFiles.includes(file)) return
      } else if (currentErrors.current.sourceLocation && currentErrors.current.sourceLocation.file && currentErrors.current.sourceLocation.file === file) return
    }
    // if current file is changed while debugging and one of the files imported in test file are opened
    // do not clear the test results in SUT plugin
    if ((isDebugging.current && testTab.allFilesInvolved.includes(file)) || currentTestFiles.current.includes(file)) return
    allTests.current = []
    updateTestFileList()
    clearResults()
    try {
      const tests = await testTabLogic.getTests()
      allTests.current = tests
      selectedTests.current = [...allTests.current]
      updateTestFileList()
      if (!areTestsRunning.current) await updateRunAction(file)
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log(e)
      setToasterMsg(e)
    }
  }

  /**
 * Changes the current path of Unit Testing Plugin
 * @param path - the path from where UT plugin takes _test.sol files to run
 */
  const setCurrentPath = async (path: string) => {
    testTabLogic.setCurrentPath(path)
    setInputPathValue(path)
    updateDirList(path)
    await updateForNewCurrent()
  }

  useEffect(() => {
    if (initialPath) setCurrentPath(initialPath)
  }, [initialPath]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    testTab.on('filePanel', 'newTestFileCreated', async (file: string) => {
      try {
        const tests = await testTabLogic.getTests()
        allTests.current = tests
        selectedTests.current = [...allTests.current]
        updateTestFileList()
      } catch (e) {
        console.log(e)
        allTests.current.push(file)
        selectedTests.current.push(file)
      }
    })

    testTab.on('filePanel', 'setWorkspace', async () => {
      await setCurrentPath(defaultPath)
    })

    const truncateVersion = (version: string) => {
      const tmp: RegExpExecArray | null = /^(\d+.\d+.\d+)/.exec(version)
      return tmp ? tmp[1] : version
    }

    testTab.fileManager.events.on('noFileSelected', async () => { await updateForNewCurrent() })
    testTab.fileManager.events.on('currentFileChanged', async (file: string) => {
      await updateForNewCurrent(file)
    })
    testTab.on('solidity', 'compilerLoaded', async (version: string, license: string) => {
      const { currentVersion } = testTab.compileTab.getCurrentCompilerConfig()

      if (!semver.gt(truncateVersion(currentVersion), '0.4.12')) {
        setDisableRunButton(true)
        setRunButtonTitle('Please select Solidity compiler version greater than 0.4.12.')
      }
    })

  }, []) // eslint-disable-line

  const updateDirList = (path: string) => {
    testTabLogic.dirList(path).then((options: string[]) => {
      setPathOptions(options)
    })
  }

  const handleTestDirInput = async (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let testDirInput = trimTestDirInput(e.target.value)
    testDirInput = helper.removeMultipleSlashes(testDirInput)
    setInputPathValue(testDirInput)
    if (testDirInput) {
      if (testDirInput.endsWith('/') && testDirInput !== '/') {
        testDirInput = helper.removeTrailingSlashes(testDirInput)
        if (testTabLogic.currentPath === testDirInput.substr(0, testDirInput.length - 1)) {
          setDisableCreateButton(true)
          setDisableGenerateButton(true)
        }
        updateDirList(testDirInput)
      } else {
        // If there is no matching folder in the workspace with entered text, enable Create button
        if (await testTabLogic.pathExists(testDirInput)) {
          setDisableCreateButton(true)
          setDisableGenerateButton(false)

        } else {
          // Enable Create button
          setDisableCreateButton(false)
          // Disable Generate button because dir does not exist
          setDisableGenerateButton(true)
        }
        await setCurrentPath(testDirInput)
      }
    } else {
      await setCurrentPath('/')
      setDisableCreateButton(true)
      setDisableGenerateButton(false)
    }
  }

  const handleCreateFolder = async () => {
    let inputPath = trimTestDirInput(inputPathValue)
    let path = helper.removeMultipleSlashes(inputPath)
    if (path !== '/') path = helper.removeTrailingSlashes(path)
    if (inputPath === '') inputPath = defaultPath
    setInputPathValue(path)
    await testTabLogic.generateTestFolder(inputPath)
    setToasterMsg('Folder created successfully')
    setDisableCreateButton(true)
    setDisableGenerateButton(false)
    testTabLogic.setCurrentPath(inputPath)
    await updateRunAction()
    await updateForNewCurrent()
    pathOptions.push(inputPath)
    setPathOptions(pathOptions)
  }

  const cleanFileName = (fileName: string, testSuite: string) => {
    return fileName ? fileName.replace(/\//g, '_').replace(/\./g, '_') + testSuite : fileName
  }

  const startDebug = async (txHash: string, web3: Web3) => {
    isDebugging.current = true
    if (!await testTab.appManager.isActive('debugger')) await testTab.appManager.activatePlugin('debugger')
    testTab.call('menuicons', 'select', 'debugger')
    testTab.call('debugger', 'debug', txHash, web3)
  }

  const printHHLogs = (logsArr: Record<string, any>[], testName: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    _paq.push(['trackEvent', 'solidityUnitTesting', 'hardhat', 'console.log'])
    testTab.call('terminal', 'log', { type: 'info', value: finalLogs })
  }

  const discardHighlight = async () => {
    await testTab.call('editor', 'discardHighlight')
  }

  const highlightLocation = async (location: string, fileName: string) => {
    if (location) {
      const split = location.split(':')
      const file = split[2]
      const parsedLocation = {
        start: parseInt(split[0]),
        length: parseInt(split[1])
      }
      const locationToHighlight = testTab.offsetToLineColumnConverter.offsetToLineColumnWithContent(
        parsedLocation,
        parseInt(file),
        filesContent[fileName].content
      )
      await testTab.call('editor', 'discardHighlight')
      await testTab.call('editor', 'highlight', locationToHighlight, fileName, '', { focus: true })
    }
  }

  const renderContract = (filename: string, contract: string|null, index: number, withoutLabel = false) => {
    if (withoutLabel) {
      const contractCard: ReactElement = (
        <div id={runningTestFileName} data-id="testTabSolidityUnitTestsOutputheader" className="pt-1">
          <span className="font-weight-bold">{contract ? contract : ''} ({filename})</span>
        </div>
      )
      setTestsOutput(prevCards => ([...prevCards, contractCard]))
      return
    }
    let label
    if (index > -1) {
      const className = "alert-danger d-inline-block mb-1 mr-1 p-1 failed_" + runningTestFileName
      label = (<OverlayTrigger placement={'right'} overlay={
              <Tooltip className="text-nowrap" id="info-recorder">
                <span>At least one contract test failed</span>
              </Tooltip>
            }><div
      className={className}
    >
      FAIL
    </div></OverlayTrigger>)
    } else {
      const className = "alert-success d-inline-block mb-1 mr-1 p-1 passed_" + runningTestFileName
      label = (<OverlayTrigger placement={'top-end'} overlay={
              <Tooltip className="text-nowrap" id="info-recorder">
                <span>All contract tests passed</span>
              </Tooltip>
            }><div
      className={className}
    >
      PASS
    </div></OverlayTrigger>)
    }
    // show contract and file name with label
    const ContractCard: ReactElement = (
      <div id={runningTestFileName} data-id="testTabSolidityUnitTestsOutputheader" className="pt-1">
        {label}<span className="font-weight-bold">{contract} ({filename})</span>
      </div>
    )
    setTestsOutput(prevCards => {
      const index = prevCards.findIndex((card: ReactElement) => card.props.id === runningTestFileName)
      prevCards[index] = ContractCard
      return prevCards
    })
  }

  const renderTests = (tests: TestResultInterface[], contract: string, filename: string) => {
    const index = tests.findIndex((test: TestResultInterface) => test.type === 'testFailure')
    // show filename and contract
    renderContract(filename, contract, index)
    // show tests
    for (const test of tests) {
      if (!test.rendered) {
        let debugBtn
        if (test.debugTxHash) {
          const { web3, debugTxHash } = test
          debugBtn = (
            <div id={test.value.replaceAll(' ', '_')} className="btn border btn btn-sm ml-1" style={{ cursor: 'pointer' }} onClick={() => startDebug(debugTxHash, web3)}>
              <OverlayTrigger placement={'top-start'} overlay={
              <Tooltip className="text-nowrap" id="info-recorder">
                <span>Start debugging</span>
              </Tooltip>
            }><i className="fas fa-bug"></i></OverlayTrigger>
            </div>
          )
        }
        if (test.type === 'testPass') {
          if (test.hhLogs && test.hhLogs.length) printHHLogs(test.hhLogs, test.value)
          const testPassCard: ReactElement = (
            <div
              id={runningTestFileName}
              data-id="testTabSolidityUnitTestsOutputheader"
              className="testPass testLog bg-light mb-2 px-2 text-success border-0"
              onClick={() => discardHighlight()}
            >
              <div className="d-flex my-1 align-items-start justify-content-between">
                <span > ✓ {test.value}</span>
                {debugBtn}
              </div>
            </div>
          )
          setTestsOutput(prevCards => ([...prevCards, testPassCard]))
          test.rendered = true
        } else if (test.type === 'testFailure') {
          if (test.hhLogs && test.hhLogs.length) printHHLogs(test.hhLogs, test.value)
          if (!test.assertMethod) {
            const testFailCard1: ReactElement = (<div
              className="bg-light mb-2 px-2 testLog d-flex flex-column text-danger border-0"
              id={"UTContext" + test.context}
              onClick={() => { if(test.location) highlightLocation(test.location, test.filename)}}
            >
              <div className="d-flex my-1 align-items-start justify-content-between">
                <span> ✘ {test.value}</span>
                {debugBtn}
              </div>
              <span className="text-dark">Error Message:</span>
              <span className="pb-2 text-break">"{test.errMsg}"</span>
            </div>)
            setTestsOutput(prevCards => ([...prevCards, testFailCard1]))
          } else {
            const preposition = test.assertMethod === 'equal' || test.assertMethod === 'notEqual' ? 'to' : ''
            const method = test.assertMethod === 'ok' ? '' : test.assertMethod
            const expected = test.assertMethod === 'ok' ? '\'true\'' : test.expected
            const testFailCard2: ReactElement = (<div
              className="bg-light mb-2 px-2 testLog d-flex flex-column text-danger border-0"
              id={"UTContext" + test.context}
              onClick={() => { if(test.location) highlightLocation(test.location, test.filename)}}
            >
              <div className="d-flex my-1 align-items-start justify-content-between">
                <span> ✘ {test.value}</span>
                {debugBtn}
              </div>
              <span className="text-dark">Error Message:</span>
              <span className="pb-2 text-break">"{test.errMsg}"</span>
              <span className="text-dark">Assertion:</span>
              <div className="d-flex flex-wrap">
                <span>Expected value should be</span>
                <div className="mx-1 font-weight-bold">{method}</div>
                <div>{preposition} {expected}</div>
              </div>
              <span className="text-dark">Received value:</span>
              <span>{test.returned}</span>
              <span className="text-dark text-sm pb-2">Skipping the remaining tests of the function.</span>
            </div>)
            setTestsOutput(prevCards => ([...prevCards, testFailCard2]))
          }
          test.rendered = true
        } else if (test.type === 'logOnly') {
          if (test.hhLogs && test.hhLogs.length) printHHLogs(test.hhLogs, test.value)
          test.rendered = true
        }
      }
    }
  }

  const showTestsResult = () => {
    const filenames = Object.keys(testsResultByFilename)
    currentTestFiles.current = filenames
    for (const filename of filenames) {
      const fileTestsResult = testsResultByFilename[filename]
      const contracts = Object.keys(fileTestsResult)
      for (const contract of contracts) {
        if (contract && contract !== 'summary' && contract !== 'errors') {
          runningTestFileName = cleanFileName(filename, contract)
          const tests = fileTestsResult[contract] as TestResultInterface[]
          if (tests?.length) {
            renderTests(tests, contract, filename)
          } else {
            // show only contract and file name
            renderContract(filename, contract, -1, true)
          }
        } else if (contract === 'errors' && fileTestsResult['errors']) {
          const errors = fileTestsResult['errors']
          if (errors && errors.errors) {
            errors.errors.forEach((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const errorCard: ReactElement = <Renderer message={err.formattedMessage || err.message} plugin={testTab} opt={{ type: err.severity, errorType: err.type }} />
              setTestsOutput(prevCards => ([...prevCards, errorCard]))
            })
          } else if (errors && Array.isArray(errors) && (errors[0].message || errors[0].formattedMessage)) {
            errors.forEach((err) => {
              const errorCard: ReactElement = <Renderer message={err.formattedMessage || err.message} plugin={testTab} opt={{ type: err.severity, errorType: err.type }} />
              setTestsOutput(prevCards => ([...prevCards, errorCard]))
            })
          } else if (errors && !errors.errors && !Array.isArray(errors)) {
            // To track error like this: https://github.com/ethereum/remix/pull/1438
            const errorCard: ReactElement = <Renderer message={errors.formattedMessage || errors.message} plugin={testTab} opt={{ type: 'error' }} />
            setTestsOutput(prevCards => ([...prevCards, errorCard]))
          }
        }
      }
      // show summary
      const testSummary = fileTestsResult['summary']
      if (testSummary && testSummary.filename && !testSummary.rendered) {
        const summaryCard: ReactElement = (<div className="d-flex alert-secondary mb-3 p-3 flex-column">
          <span className="font-weight-bold">Result for {testSummary.filename}</span>
          <span className="text-success">Passed: {testSummary.passed}</span>
          <span className="text-danger">Failed: {testSummary.failed}</span>
          <span>Time Taken: {testSummary.timeTaken}s</span>
        </div>)
        setTestsOutput(prevCards => ([...prevCards, summaryCard]))
        fileTestsResult['summary']['rendered'] = true
      }
    }
  }

  const testCallback = (result: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (result.filename) {
      if (!testsResultByFilename[result.filename]) {
        testsResultByFilename[result.filename] = {}
        testsResultByFilename[result.filename]['summary'] = {}
      }
      if (result.type === 'contract') {
        testsResultByFilename[result.filename][result.value] = {}
        testsResultByFilename[result.filename][result.value] = []
      } else {
        // Set that this test is not rendered on UI
        result.rendered = false
        testsResultByFilename[result.filename][result.context].push(result)
      }
      showTestsResult()
    }
  }

  const resultsCallback = (_err: any, result: any, cb: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // total stats for the test
    // result.passingNum
    // result.failureNum
    // result.timePassed
    cb()
  }

  const updateFinalResult = (_errors: any, result: FinalResult|null, filename: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    ++readyTestsNumber
    setReadyTestsNumber(readyTestsNumber)
    if (!result && (_errors && (_errors.errors || (Array.isArray(_errors) && (_errors[0].message || _errors[0].formattedMessage))))) {
      // show only file name
      renderContract(filename, null, -1, true)
      currentErrors.current = _errors.errors
    }
    if (result) {
      const totalTime = parseFloat(result.totalTime).toFixed(2)
      const testsSummary = { filename, passed: result.totalPassing, failed: result.totalFailing, timeTaken: totalTime, rendered: false }
      testsResultByFilename[filename]['summary'] = testsSummary
      showTestsResult()
    } else if (_errors) {
      if (!testsResultByFilename[filename]) {
        testsResultByFilename[filename] = {}
      }
      testsResultByFilename[filename]['errors'] = _errors
      setTestsExecutionStoppedErrorHidden(false)
      showTestsResult()
    }

    if (hasBeenStopped.current && (readyTestsNumber !== runningTestsNumber)) {
      // if all tests has been through before stopping no need to print this.
      setTestsExecutionStoppedHidden(false)
    }
    if (_errors || hasBeenStopped.current || readyTestsNumber === runningTestsNumber) {
      // All tests are ready or the operation has been canceled or there was a compilation error in one of the test files.
      setDisableStopButton(true)
      setStopButtonLabel('Stop')
      if (selectedTests.current?.length !== 0) {
        setDisableRunButton(false)
      }
      areTestsRunning.current = false
    }
  }

  const runTest = (testFilePath: string, callback: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    isDebugging.current = false
    if (hasBeenStopped.current) {
      updateFinalResult(null, null, testFilePath)
      return
    }
    testTab.fileManager.readFile(testFilePath).then((content: string) => {
      const runningTests: Record<string, Record<string, string>> = {}
      runningTests[testFilePath] = { content }
      filesContent[testFilePath] = { content }
      const { currentVersion, evmVersion, optimize, runs, isUrl } = testTab.compileTab.getCurrentCompilerConfig()
      const currentCompilerUrl = isUrl ? currentVersion : urlFromVersion(currentVersion)
      const compilerConfig = {
        currentCompilerUrl,
        evmVersion,
        optimize,
        usingWorker: canUseWorker(currentVersion),
        runs
      }
      const deployCb = async (file: string, contractAddress: string) => {
        const compilerData = await testTab.call('compilerArtefacts', 'getCompilerAbstract', file)
        await testTab.call('compilerArtefacts', 'addResolvedContract', contractAddress, compilerData)
      }
      testTab.testRunner.runTestSources(
        runningTests,
        compilerConfig,
        (result: Record<string, any>) => testCallback(result), // eslint-disable-line @typescript-eslint/no-explicit-any
        (_err: any, result: any, cb: any) => resultsCallback(_err, result, cb), // eslint-disable-line @typescript-eslint/no-explicit-any
        deployCb,
        (error: any, result: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          updateFinalResult(error, result, testFilePath)
          callback(error)
        }, (url: string, cb: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          return testTab.contentImport.resolveAndSave(url).then((result: any) => cb(null, result)).catch((error: Error) => cb(error.message)) // eslint-disable-line @typescript-eslint/no-explicit-any
        }, { testFilePath }
      )
    }).catch((error: Error) => {
      console.log(error)
      if (error) return // eslint-disable-line
    })
  }

  const runTests = () => {
    areTestsRunning.current = true
    hasBeenStopped.current = false
    readyTestsNumber = 0
    setReadyTestsNumber(readyTestsNumber)
    runningTestsNumber = selectedTests.current.length
    setRunningTestsNumber(runningTestsNumber)
    setDisableStopButton(false)
    clearResults()
    setProgressBarHidden(false)
    const tests: string[] = selectedTests.current
    if (!tests || !tests.length) return
    else setProgressBarHidden(false)
    _paq.push(['trackEvent', 'solidityUnitTesting', 'runTests'])
    eachOfSeries(tests, (value: string, key: string, callback: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (hasBeenStopped.current) return
      runTest(value, callback)
    })
  }

  const updateRunAction = async (currentFile: any = null) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const isSolidityActive = await testTab.appManager.isActive('solidity')
    if (!isSolidityActive || !selectedTests.current.length) {
      setDisableRunButton(true)
      if (!currentFile || (currentFile && currentFile.split('.').pop().toLowerCase() !== 'sol')) {
        setRunButtonTitle('No solidity file selected')
      } else {
        setRunButtonTitle('The "Solidity Plugin" should be activated')
      }
    } else setDisableRunButton(false)
  }

  const stopTests = () => {
    hasBeenStopped.current = true
    setStopButtonLabel('Stopping')
    setDisableStopButton(true)
    setDisableRunButton(true)
  }

  const getCurrentSelectedTests = () => {
    const selectedTestsList: TestObject[] = testFiles.filter(testFileObj => testFileObj.checked)
    return selectedTestsList.map(testFileObj => testFileObj.fileName)
  }

  const toggleCheckbox = (eChecked: boolean, index: number) => {
    testFiles[index].checked = eChecked
    setTestFiles([...testFiles])
    selectedTests.current = getCurrentSelectedTests()
    if (eChecked) {
      setCheckSelectAll(true)
      setDisableRunButton(false)
      if ((readyTestsNumber === runningTestsNumber || hasBeenStopped.current) && stopButtonLabel.trim() === 'Stop') {
        setRunButtonTitle('Run tests')
      }
    } else if (!selectedTests.current.length) {
      setCheckSelectAll(false)
      setDisableRunButton(true)
      setRunButtonTitle('No test file selected')
    } else setCheckSelectAll(false)
  }

  const checkAll = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    testFiles.forEach((testFileObj) => testFileObj.checked = event.target.checked)
    setTestFiles([...testFiles])
    setCheckSelectAll(event.target.checked)
    if (event.target.checked) {
      selectedTests.current = getCurrentSelectedTests()
      setDisableRunButton(false)
    } else {
      selectedTests.current = []
      setDisableRunButton(true)
    }
  }

  const updateTestFileList = () => {
    if (allTests.current?.length) {
      testFiles = allTests.current.map((testFile: string) => { return { 'fileName': testFile, 'checked': true } })
      setCheckSelectAll(true)
    }
    else
      testFiles = []
    setTestFiles([...testFiles])
  }

  return (
    <div className="px-2" id="testView">
      <Toaster message={toasterMsg} />
      <div className="infoBox">
        <p className="text-lg"> Test your smart contract in Solidity.</p>
        <p> Select directory to load and generate test files.</p>
        <label>Test directory:</label>
        <div>
          <div className="d-flex p-2">
            <datalist id="utPathList">{
              pathOptions.map(function (path) {
                return <option key={path}>{path}</option>
              })
            }
            </datalist>
            <OverlayTrigger
              placement="top-end"
              overlay={
                <Tooltip className="text-nowrap" id="uiPathInputtooltip">
                  <span>{"Press 'Enter' to change the path for test files."}</span>
                </Tooltip>
              }
            >
              <input
                list="utPathList"
                className="inputFolder custom-select"
                id="utPath"
                data-id="uiPathInput"
                name="utPath"
                value={inputPathValue}
                style={{ backgroundImage: "var(--primary)" }}
                onKeyDown={() => { if (inputPathValue === '/') setInputPathValue('')} }
                onChange={handleTestDirInput}
                onClick = {() => { if (inputPathValue === '/') setInputPathValue('')} }
              />
            </OverlayTrigger>
            <OverlayTrigger
              placement="top-end"
              overlay={
                <Tooltip className="text-nowrap" id="uiPathInputButtontooltip">
                  <span>Create a test folder</span>
                </Tooltip>
              }
            >
              <button
                className="btn border ml-2"
                data-id="testTabGenerateTestFolder"
                disabled={disableCreateButton}
                onClick={handleCreateFolder}
              >
                Create
              </button>
            </OverlayTrigger>
          </div>
        </div>
      </div>
      <div>
        <div className="d-flex p-2">
          <OverlayTrigger overlay={
            <Tooltip id="generateTestsButtontooltip" className="text-nowrap">
              <span>Generate a sample test file</span>
            </Tooltip>
          } placement={'bottom-start'}>
            <button
              className="btn border w-50"
              data-id="testTabGenerateTestFile"
              disabled={disableGenerateButton}
              onClick={async () => {
                await testTabLogic.generateTestFile((err:any) => { if (err) setToasterMsg(err)}) // eslint-disable-line @typescript-eslint/no-explicit-any
                await updateForNewCurrent()
              }}
            >
              Generate
            </button>
          </OverlayTrigger>
          <OverlayTrigger overlay={
            <Tooltip id="generateTestsLinktooltip" className="text-nowrap">
              <span>Check out documentation.</span>
            </Tooltip>
          } placement={'bottom-start'}>
          <a className="btn border text-decoration-none pr-0 d-flex w-50 ml-2" target="__blank" href="https://remix-ide.readthedocs.io/en/latest/unittesting.html#test-directory">
            <label className="btn p-1 ml-2 m-0">How to use...</label>
          </a>
        </OverlayTrigger>
        </div>
        <div className="d-flex p-2">
          <OverlayTrigger placement={'top-start'} overlay={
              <Tooltip className="text-nowrap" id="info-recorder">
                <span>
                  {runButtonTitle}
                </span>
              </Tooltip>
            }>
            <button id="runTestsTabRunAction"data-id="testTabRunTestsTabRunAction" className="w-50 btn btn-primary" disabled={disableRunButton} onClick={runTests}>
              <span className="fas fa-play ml-2"></span>
              <label className="labelOnBtn btn btn-primary p-1 ml-2 m-0">Run</label>
            </button>
          </OverlayTrigger>
          <button id="runTestsTabStopAction" data-id="testTabRunTestsTabStopAction" className="w-50 pl-2 ml-2 btn btn-secondary" disabled={disableStopButton} onClick={stopTests}>
            <OverlayTrigger placement={'top-start'} overlay={
                <Tooltip className="text-nowrap" id="info-recorder">
                  <span>
                    Stop running tests
                  </span>
                </Tooltip>
              }>
              <span>
                <span className="fas fa-stop ml-2"></span>
                <label className="labelOnBtn btn btn-secondary p-1 ml-2 m-0" id="runTestsTabStopActionLabel">{stopButtonLabel}</label>
              </span>
            </OverlayTrigger>
          </button>
        </div>
        <div className="d-flex align-items-center mx-3 pb-2 mt-2 border-bottom">
          <input id="checkAllTests"
            type="checkbox"
            data-id="testTabCheckAllTests"
            onClick={checkAll}
            checked={checkSelectAll}
            onChange={() => { }} // eslint-disable-line
          />
          <label className="text-nowrap pl-2 mb-0" htmlFor="checkAllTests"> Select all </label>
        </div>
        <div className="testList py-2 mt-0 border-bottom">{testFiles.length ? testFiles.map((testFileObj: TestObject, index) => {
          const elemId = `singleTest${testFileObj.fileName}`
          return (
            <div className="d-flex align-items-center py-1" key={index}>
              <input data-id="singleTest" className="singleTest" id={elemId} onChange={(e) => toggleCheckbox(e.target.checked, index)} type="checkbox" checked={testFileObj.checked} />
              <label className="singleTestLabel text-nowrap pl-2 mb-0" htmlFor={elemId}>{testFileObj.fileName}</label>
            </div>
          )
        })
          : "No test file available"} </div>
        <div className="align-items-start flex-column mt-2 mx-3 mb-0">
          <span className='text-info h6' hidden={progressBarHidden}>Progress: {readyTestsNumber} finished (of {runningTestsNumber})</span>
          <label className="text-warning h6" data-id="testTabTestsExecutionStopped" hidden={testsExecutionStoppedHidden}>The test execution has been stopped</label>
          <label className="text-danger h6" data-id="testTabTestsExecutionStoppedError" hidden={testsExecutionStoppedErrorHidden}>The test execution has been stopped because of error(s) in your test file</label>
        </div>
        <div className="mx-3 mb-2 pb-4 border-primary" id="solidityUnittestsOutput" data-id="testTabSolidityUnitTestsOutput">{testsOutput}</div>
      </div>
    </div>
  )
}

export default SolidityUnitTesting
