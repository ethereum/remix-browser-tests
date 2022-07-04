
import { editor, languages, Position } from 'monaco-editor'
import { EditorUIProps } from '../remix-ui-editor'
export class RemixHoverProvider implements languages.HoverProvider {

    props: EditorUIProps
    monaco: any
    constructor(props: any, monaco: any) {
        this.props = props
        this.monaco = monaco
    }

    provideHover = async function (model: editor.ITextModel, position: Position) {
        console.log('HOVERING')

        const cursorPosition = this.props.editorAPI.getHoverPosition(position)

        const nodeAtPosition = await this.props.plugin.call('codeParser', 'definitionAtPosition', cursorPosition)
        console.log(nodeAtPosition)
        const contents = []

        const getDocs = async (node: any) => {
            contents.push({
                value: await this.props.plugin.call('codeParser', 'getNodeDocumentation', node)
            })
        }

        const getScope = async (node: any) => {
            if (node.id) {
                contents.push({
                    value: `id: ${node.id}`
                })
            }
            if (node.scope) {
                contents.push({
                    value: `scope: ${node.scope}`
                })
            }

        }

        const getLinks = async (node: any) => {
            contents.push({
                value: await this.props.plugin.call('codeParser', 'getNodeLink', node)
            })
        }

        const getVariableDeclaration = async (node: any) => {
            return await this.props.plugin.call('codeParser', 'getVariableDeclaration', node)
        }


        const getParamaters = async (node: any) => {
            return await this.props.plugin.call('codeParser', 'getFunctionParamaters', node)
        }

        const getReturnParameters = async (node: any) => {
            return await this.props.plugin.call('codeParser', 'getFunctionReturnParameters', node)
        }


        const getOverrides = async (node: any) => {
            if (node.overrides) {
                const overrides = []
                for (const override of node.overrides.overrides) {
                    overrides.push(override.name)
                }
                if (overrides.length)
                    return ` overrides (${overrides.join(', ')})`
            }
            return ''
        }

        const getlinearizedBaseContracts = async (node: any) => {
            const params = []
            if (node.linearizedBaseContracts) {
                for (const id of node.linearizedBaseContracts) {
                    const baseContract = await this.props.plugin.call('codeParser', 'getNodeById', id)
                    params.push(
                        baseContract.name
                    )
                }
                if (params.length)
                    return `is ${params.join(', ')}`
            }
            return ''
        }

        if (nodeAtPosition) {
            if (nodeAtPosition.absolutePath) {
                const target = await this.props.plugin.call('fileManager', 'getPathFromUrl', nodeAtPosition.absolutePath)
                if (target.file !== nodeAtPosition.absolutePath) {
                    contents.push({
                        value: `${target.file}`
                    })
                }
                contents.push({
                    value: `${nodeAtPosition.absolutePath}`
                })
            }
            if (nodeAtPosition.nodeType === 'VariableDeclaration') {
                contents.push({
                    value: await getVariableDeclaration(nodeAtPosition)
                })

            }
            else if (nodeAtPosition.nodeType === 'ElementaryTypeName') {
                contents.push({
                    value: `${nodeAtPosition.typeDescriptions.typeString}`
                })

            } else if (nodeAtPosition.nodeType === 'FunctionDefinition') {
                if (!nodeAtPosition.name) return
                const returns = await getReturnParameters(nodeAtPosition)
                contents.push({
                    value: `function ${nodeAtPosition.name} ${await getParamaters(nodeAtPosition)} ${nodeAtPosition.visibility} ${nodeAtPosition.stateMutability}${await getOverrides(nodeAtPosition)} ${returns ? `returns ${returns}` : ''}`
                })

            } else if (nodeAtPosition.nodeType === 'ModifierDefinition') {
                contents.push({
                    value: `modifier ${nodeAtPosition.name} ${await getParamaters(nodeAtPosition)}`
                })
            } else if (nodeAtPosition.nodeType === 'EventDefinition') {
                contents.push({
                    value: `modifier ${nodeAtPosition.name} ${await getParamaters(nodeAtPosition)}`
                })
            } else if (nodeAtPosition.nodeType === 'ContractDefinition') {
                contents.push({
                    value: `${nodeAtPosition.contractKind || nodeAtPosition.kind} ${nodeAtPosition.name} ${await getlinearizedBaseContracts(nodeAtPosition)}`
                })

            } else if (nodeAtPosition.nodeType === 'InvalidNode') {
                contents.push({
                    value: `There are errors in the code.`
                })
            } else if (nodeAtPosition.nodeType === 'Block') {

            } else {
                contents.push({
                    value: `${nodeAtPosition.nodeType}`
                })

            }

            for (const key in contents) {
                contents[key].value = '```remix-solidity\n' + contents[key].value + '\n```'
            }
            getLinks(nodeAtPosition)
            getDocs(nodeAtPosition)
            // getScope(nodeAtPosition)
        }


        return {
            range: new this.monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                model.getLineMaxColumn(position.lineNumber)
            ),
            contents: contents
        };
    }

}