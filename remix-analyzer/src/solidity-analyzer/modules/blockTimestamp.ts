import { default as category } from './categories'
import { isNowAccess, isBlockTimestampAccess } from './staticAnalysisCommon'
import { default as algorithm } from './algorithmCategories'
import { AnalyzerModule, ModuleAlgorithm, ModuleCategory, ReportObj, CompilationResult, IdentifierAstNode, 
  MemberAccessAstNode} from './../../types'

export default class blockTimestamp implements AnalyzerModule {
  warningNowNodes: IdentifierAstNode[] = []
  warningblockTimestampNodes: MemberAccessAstNode[] = []
  name: string = `Block timestamp: `
  description: string = `Can be influenced by miners`
  category: ModuleCategory = category.SECURITY
  algorithm: ModuleAlgorithm = algorithm.EXACT

  visit (node: IdentifierAstNode | MemberAccessAstNode ): void {
    if (node.nodeType === "Identifier" && isNowAccess(node)) this.warningNowNodes.push(node)
    else if (node.nodeType === "MemberAccess" && isBlockTimestampAccess(node)) this.warningblockTimestampNodes.push(node)
  }

  report (compilationResults: CompilationResult): ReportObj[] {
    return this.warningNowNodes.map((item, i) => {
      return {
        warning: `Use of "now": "now" does not mean current time. "now" is an alias for "block.timestamp". 
                  "block.timestamp" can be influenced by miners to a certain degree, be careful.`,
        location: item.src,
        more: 'http://solidity.readthedocs.io/en/develop/frequently-asked-questions.html#are-timestamps-now-block-timestamp-reliable'
      }
    }).concat(this.warningblockTimestampNodes.map((item, i) => {
      return {
        warning: `Use of "block.timestamp": "block.timestamp" can be influenced by miners to a certain degree. 
                  That means that a miner can "choose" the block.timestamp, to a certain degree, to change the outcome of a transaction in the mined block.`,
        location: item.src,
        more: 'http://solidity.readthedocs.io/en/develop/frequently-asked-questions.html#are-timestamps-now-block-timestamp-reliable'
      }
    }))
  }
}
