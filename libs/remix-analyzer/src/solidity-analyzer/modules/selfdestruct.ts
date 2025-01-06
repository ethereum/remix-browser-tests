import category from './categories'
import { isStatement, isSelfdestructCall } from './staticAnalysisCommon'
import algorithm from './algorithmCategories'
import AbstractAst from './abstractAstView'
import { AnalyzerModule, ModuleAlgorithm, ModuleCategory, ReportObj, ContractHLAst, VisitFunction, ReportFunction, SupportedVersion } from './../../types'

export default class selfdestruct implements AnalyzerModule {
  name = 'Selfdestruct: '
  description = 'Contracts using destroyed contract can be broken'
  category: ModuleCategory = category.SECURITY
  algorithm: ModuleAlgorithm = algorithm.HEURISTIC
  version: SupportedVersion = {
    start: '0.4.12'
  }

  abstractAst: AbstractAst = new AbstractAst()

  visit: VisitFunction = this.abstractAst.build_visit(
    (node: any) => isStatement(node) || (node.nodeType === 'FunctionCall' && isSelfdestructCall(node))
  )

  report: ReportFunction = this.abstractAst.build_report(this._report.bind(this))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _report (contracts: ContractHLAst[], multipleContractsWithSameName: boolean, version: string): ReportObj[] {
    const warnings: ReportObj[] = []

    contracts.forEach((contract) => {
      contract.functions.forEach((func) => {
        let hasSelf = false
        func.relevantNodes.forEach((node) => {
          if (isSelfdestructCall(node)) {
            warnings.push({
              warning: 'Use of selfdestruct: Can block calling contracts unexpectedly. Be especially careful if this contract is planned to be used by other contracts (i.e. library contracts, interactions). Selfdestruction of the callee contract can leave callers in an inoperable state.',
              location: node.src,
              more: 'https://paritytech.io/blog/security-alert.html'
            })
            hasSelf = true
          }
          if (isStatement(node) && hasSelf) {
            warnings.push({
              warning: 'Use of selfdestruct: No code after selfdestruct is executed. Selfdestruct is a terminal.',
              location: node.src,
              more: `https://solidity.readthedocs.io/en/${version}/introduction-to-smart-contracts.html#deactivate-and-self-destruct`
            })
            hasSelf = false
          }
        })
      })
    })
    return warnings
  }
}
