import { CodeParser, genericASTNode } from "../code-parser";
import { lineText } from '@remix-ui/editor'

export default class CodeParserGasService {
    plugin: CodeParser

    constructor(plugin: CodeParser) {
        this.plugin = plugin
    }

    async getGasEstimates(fileName: string) {
        if (!fileName) {
            fileName = await this.plugin.currentFile
        }
        if (this.plugin.nodeIndex.nodesPerFile && this.plugin.nodeIndex.nodesPerFile[fileName] && this.plugin.nodeIndex.nodesPerFile[fileName].contracts) {
            const estimates: any = []
            for (const contract in this.plugin.nodeIndex.nodesPerFile[fileName].contracts) {
                if (this.plugin.nodeIndex.nodesPerFile[fileName].contracts[contract].contractNodes) {
                    const nodes = this.plugin.nodeIndex.nodesPerFile[fileName].contracts[contract].contractNodes
                    for (const node of Object.values(nodes) as any[]) {
                        if (node.gasEstimate) {
                            estimates.push({
                                node,
                                range: await this.plugin.getLineColumnOfNode(node)
                            })
                        }
                    }
                }
            }
            return estimates
        }

    }


    async showGasEstimates() {
        this.plugin.currentFile = await this.plugin.call('fileManager', 'file')
        this.plugin.nodeIndex.nodesPerFile[this.plugin.currentFile] = await this.plugin._extractFileNodes(this.plugin.currentFile, this.plugin.compilerAbstract)

        const gasEstimates = await this.getGasEstimates(this.plugin.currentFile)

        const friendlyNames = {
            'executionCost': 'Estimated execution cost',
            'codeDepositCost': 'Estimated code deposit cost',
            'creationCost': 'Estimated creation cost',
        }
        await this.plugin.call('editor', 'discardLineTexts')
        if (gasEstimates) {
            for (const estimate of gasEstimates) {
                const linetext: lineText = {
                    content: Object.entries(estimate.node.gasEstimate).map(([, value]) => `${value} gas`).join(' '),
                    position: estimate.range,
                    hide: false,
                    className: 'text-muted small',
                    afterContentClassName: 'text-muted small fas fa-gas-pump pl-4',
                    from: 'codeParser',
                    hoverMessage: [{
                        value: `${Object.entries(estimate.node.gasEstimate).map(([key, value]) => `${friendlyNames[key]}: ${value} gas`).join(' ')}`,
                    },
                    ],
                }

                this.plugin.call('editor', 'addLineText', linetext, estimate.range.fileName)


            }
        }
    }


}