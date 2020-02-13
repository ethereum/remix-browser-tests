import { default as category } from './categories'
import { isSubScopeWithTopLevelUnAssignedBinOp, getUnAssignedTopLevelBinOps } from './staticAnalysisCommon'
import { default as algorithm } from './algorithmCategories'
import { AnalyzerModule, ModuleAlgorithm, ModuleCategory, ReportObj, AstNodeLegacy, CompilationResult} from './../../types'

export default class assignAndCompare implements AnalyzerModule {
  warningNodes: AstNodeLegacy[] = []
  name: string = 'Result not used: '
  description: string = 'The result of an operation was not used.'
  category: ModuleCategory = category.MISC
  algorithm: ModuleAlgorithm = algorithm.EXACT

  visit (node: AstNodeLegacy): void {
    if (isSubScopeWithTopLevelUnAssignedBinOp(node)) getUnAssignedTopLevelBinOps(node).forEach((n) => this.warningNodes.push(n))
  }

  report (compilationResults: CompilationResult): ReportObj[] {
    return this.warningNodes.map((item, i) => {
      return {
        warning: 'A binary operation yields a value that is not used in the following. This is often caused by confusing assignment (=) and comparison (==).',
        location: item.src
      }
    })
  }
}
