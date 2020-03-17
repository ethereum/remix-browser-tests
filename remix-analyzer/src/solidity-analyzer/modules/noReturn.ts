import { default as category } from './categories'
import { hasFunctionBody, getFullQuallyfiedFuncDefinitionIdent, getEffectedVariableName } from './staticAnalysisCommon'
import { default as algorithm } from './algorithmCategories'
import  AbstractAst from './abstractAstView'
import { AnalyzerModule, ModuleAlgorithm, ModuleCategory, ReportObj, CompilationResult, CommonAstNode, FunctionDefinitionAstNode, ContractHLAst, FunctionHLAst} from './../../types'

export default class noReturn implements AnalyzerModule {
  name: string = 'no return: '
  description: string = 'Function with return type is not returning'
  category: ModuleCategory = category.MISC
  algorithm: ModuleAlgorithm = algorithm.EXACT

  abstractAst: AbstractAst = new AbstractAst()

  visit: Function = this.abstractAst.build_visit(
    (node: CommonAstNode) => node.nodeType === "Return" || node.nodeType === "Assignment"
  )

  report: Function = this.abstractAst.build_report(this._report.bind(this))
  private _report (contracts: ContractHLAst[], multipleContractsWithSameName: boolean): ReportObj[] {
    const warnings: ReportObj[] = []

    contracts.forEach((contract) => {
      contract.functions.filter((func) => hasFunctionBody(func.node)).forEach((func) => {
        const funcName: string = getFullQuallyfiedFuncDefinitionIdent(contract.node, func.node, func.parameters)
        if (this.hasNamedAndUnnamedReturns(func)) {
          warnings.push({
            warning: `${funcName}: Mixing of named and unnamed return parameters is not advised.`,
            location: func.node['src']
          })
        } else if (this.shouldReturn(func) && !(this.hasReturnStatement(func) || (this.hasNamedReturns(func) && this.hasAssignToAllNamedReturns(func)))) {
          warnings.push({
            warning: `${funcName}: Defines a return type but never explicitly returns a value.`,
            location: func.node['src']
          })
        }
      })
    })

    return warnings
  }

  private shouldReturn (func: FunctionHLAst): boolean {
    return func.returns.length > 0
  }

  private hasReturnStatement (func: FunctionHLAst): boolean {
    return func.relevantNodes.filter(n => n.nodeType === "Return").length > 0
  }

  private hasAssignToAllNamedReturns (func: FunctionHLAst): boolean {
    const namedReturns: string[] = func.returns.filter((n) => n.name.length > 0).map((n) => n.name)
    const assignedVars: string[] = func.relevantNodes.filter(n => n.nodeType === "Assignment").map(getEffectedVariableName)
    const diff: string[] = namedReturns.filter(e => !assignedVars.includes(e))
    return diff.length === 0
  }

  private hasNamedReturns (func: FunctionHLAst): boolean {
    return func.returns.filter((n) => n.name.length > 0).length > 0
  }

  private hasNamedAndUnnamedReturns (func: FunctionHLAst): boolean {
    return func.returns.filter((n) => n.name.length === 0).length > 0 &&
            this.hasNamedReturns(func)
  }
}
