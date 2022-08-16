import React from 'react'
import {
  isVyper,
  compile,
  toStandardOutput,
  VyperCompilationOutput,
  isCompilationError,
  remixClient
} from '../utils'
import Button from 'react-bootstrap/Button'

interface Props {
  compilerUrl: string
  contract?: string,
  setOutput: (name: string, output: VyperCompilationOutput) => void
}

function CompilerButton({ contract, setOutput, compilerUrl }: Props) {

  if (!contract || !contract) {
    return <Button disabled>No contract selected</Button>
  }

  if (!isVyper(contract)) {
    return <Button disabled>Not a vyper contract</Button>
  }

  /** Compile a Contract */
  async function compileContract() {
    try {
      let _contract
      try {
        _contract = await remixClient.getContract()
      } catch (e: any) {
        setOutput('', { status: 'failed', message: e.message})
        return
      }      
      remixClient.changeStatus({
        key: 'loading',
        type: 'info',
        title: 'Compiling'
      })
      let output
      try {
        output = await compile(compilerUrl, _contract)
      } catch (e: any) {
        setOutput(_contract.name, { status: 'failed', message: e.message})
        return
      }      
      setOutput(_contract.name, output)
      // ERROR
      if (isCompilationError(output)) {
        const line = output.line
        if (line) {
          const lineColumnPos = {
            start: { line: line - 1 },
            end: { line: line - 1 }
          }
          remixClient.highlight(lineColumnPos as any, _contract.name, '#e0b4b4')
        }
        throw new Error(output.message)
      }
      // SUCCESS
      remixClient.discardHighlight()
      remixClient.changeStatus({
        key: 'succeed',
        type: 'success',
        title: 'succeed'
      })
      const data = toStandardOutput(_contract.name, output)
      remixClient.compilationFinish(_contract.name, _contract.content, data)
    } catch (err: any) {
      remixClient.changeStatus({
        key: 'failed',
        type: 'error',
        title: err.message
      })
    }
  }

  return (
    <Button data-id="compile" onClick={compileContract} variant="primary">
      Compile {contract}
    </Button>
  )
}

export default CompilerButton
