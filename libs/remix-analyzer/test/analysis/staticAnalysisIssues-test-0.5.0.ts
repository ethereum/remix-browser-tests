import * as test from "tape"
import { helpers } from '@remix-project/remix-lib'
import { readFileSync } from 'fs'
import { join } from 'path'
import { default as StatRunner } from '../../src/solidity-analyzer'
import { CompilationResult, AnalysisReportObj, AnalysisReport } from '../../src/types'
import { checksEffectsInteraction } from '../../src/solidity-analyzer/modules/'
import { install, require as requireNPMmodule } from 'npm-install-version'
install('solc@0.5.0')
const compiler = requireNPMmodule('solc@0.5.0')
const {compilerInput  } = helpers.compiler
const folder: string = 'solidity-v0.5'

function compile (fileName): CompilationResult {
  const content: string = readFileSync(join(__dirname, 'test-contracts/' + folder, fileName), 'utf8')
  return JSON.parse(compiler.compile(compilerInput(content)))
}

test('staticAnalysisIssues.functionParameterPassingError', function (t) {
  // https://github.com/ethereum/remix-ide/issues/889#issuecomment-351746474
  t.plan(2)
  const res: CompilationResult = compile('functionParameters.sol')
  const Module: any = checksEffectsInteraction
  const statRunner: StatRunner = new StatRunner()

  t.doesNotThrow(() => {
    statRunner.runWithModuleList(res, [{ name: new Module().name, mod: new Module() }], (reports: AnalysisReport[]) => {})
  }, 'Analysis should not throw')

  statRunner.runWithModuleList(res, [{ name: new Module().name, mod: new Module() }], (reports: AnalysisReport[]) => {
    t.ok(!reports.some((mod: AnalysisReport) => mod.report.some((rep: AnalysisReportObj) => rep.warning.includes('INTERNAL ERROR')), 'Should not have internal errors'))
  })
})
