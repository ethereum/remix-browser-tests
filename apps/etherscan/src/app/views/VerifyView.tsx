import React, { useRef, useState } from "react"

import {
  PluginClient,
} from "@remixproject/plugin"
import { Formik, ErrorMessage, Field } from "formik"

import { SubmitButton } from "../components"
import { Receipt } from "../types"
import { verify } from "../utils/verify"
import { receiptGuidScript, verifyScript } from "../utils/scripts"

interface Props {
  client: PluginClient
  apiKey: string
  onVerifiedContract: (receipt: Receipt) => void
  contracts: string[]
}

interface FormValues {
  contractName: string
  contractArguments: string
  contractAddress: string
}

export const VerifyView: React.FC<Props> = ({
  apiKey,
  client,
  contracts,
  onVerifiedContract,
}) => {
  const [results, setResults] = useState("")
  const [networkName, setNetworkName] = useState("")
  const verificationResult = useRef({})

  const onVerifyContract = async (values: FormValues) => {
    const compilationResult = (await client.call(
      "solidity",
      "getCompilationResult"
    )) as any

    if (!compilationResult) {
      throw new Error("no compilation result available")
    }

    const contractArguments = values.contractArguments.replace("0x", "")    
    verificationResult.current = await verify(
      apiKey,
      values.contractAddress,
      contractArguments,
      values.contractName,
      compilationResult,
      client,
      onVerifiedContract,
      setResults,
    )
    setResults(verificationResult.current['message'])
  }

  return (
    <div>
      <Formik
        initialValues={{
          contractName: "",
          contractArguments: "",
          contractAddress: "",
        }}
        validate={(values) => {
          const errors = {} as any
          if (!values.contractName) {
            errors.contractName = "Required"
          }
          if (!values.contractAddress) {
            errors.contractAddress = "Required"
          }
          if (values.contractAddress.trim() === "" || !values.contractAddress.startsWith('0x') 
              || values.contractAddress.length !== 42) {
            errors.contractAddress = "Please enter a valid contract address"
          }
          return errors
        }}
        onSubmit={(values) => onVerifyContract(values)}
      >
        {({ errors, touched, handleSubmit, isSubmitting }) => {
          if (client && client.call) client.call("network", "detectNetwork").then((network) => {
            if (network && network['name']) setNetworkName(network['name'])
          })

          return (<form onSubmit={handleSubmit}>
            <h6>Verify your smart contracts</h6>
            <div className="form-group">
              <label htmlFor="network">Selected Network</label> 
              <Field
                className="form-control form-control-sm"
                type="text"
                name="network"
                value={networkName}
              />  
              <label htmlFor="contractName">Contract Name</label>              
              <Field
                as="select"
                className={
                  errors.contractName && touched.contractName && contracts.length
                    ? "form-control form-control-sm is-invalid"
                    : "form-control form-control-sm"
                }
                name="contractName"
              >
                <option disabled={true} value="">
                  Select a contract
                </option>
                {contracts.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                className="invalid-feedback"
                name="contractName"
                component="div"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contractArguments">Constructor Arguments</label>
              <Field
                className={
                  errors.contractArguments && touched.contractArguments
                    ? "form-control form-control-sm is-invalid"
                    : "form-control form-control-sm"
                }
                type="text"
                name="contractArguments"
                placeholder="hex encoded args"
              />
              <ErrorMessage
                className="invalid-feedback"
                name="contractArguments"
                component="div"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contractAddress">Contract Address</label>
              <Field
                className={
                  errors.contractAddress && touched.contractAddress
                    ? "form-control form-control-sm is-invalid"
                    : "form-control form-control-sm"
                }
                type="text"
                name="contractAddress"
                placeholder="e.g. 0x11b79afc03baf25c631dd70169bb6a3160b2706e"
              />
              <ErrorMessage
                className="invalid-feedback"
                name="contractAddress"
                component="div"
              />
            </div>

            <SubmitButton dataId="verify-contract" text="Verify Contract" isSubmitting={isSubmitting} />
            <br/><br/>
            <button
              type="button"
              style={{ padding: "0.25rem 0.4rem", marginRight: "0.5em", marginBottom: "0.5em"}}
              className="btn btn-primary"
              title="Generate the required TS scripts to verify a contract on Etherscan"
              onClick={async () => {
                if (!await client.call('fileManager', 'exists' as any, 'scripts/etherscan/receiptStatus.ts')) {
                  await client.call('fileManager', 'writeFile', 'scripts/etherscan/receiptStatus.ts', receiptGuidScript)
                  await client.call('fileManager', 'open', 'scripts/etherscan/receiptStatus.ts')
                } else {
                  client.call('notification' as any, 'toast', 'File receiptStatus.ts already exists')
                }
                
                if (!await client.call('fileManager', 'exists' as any, 'scripts/etherscan/verify.ts')) {
                  await client.call('fileManager', 'writeFile', 'scripts/etherscan/verify.ts', verifyScript)
                  await client.call('fileManager', 'open', 'scripts/etherscan/verify.ts')
                } else {
                  client.call('notification' as any, 'toast', 'File verify.ts already exists')
                }
              }}
              >
                Generate Verification Scripts
              </button>
          </form>
          )
        }
        }
      </Formik>

      <div data-id="verify-result"
        style={{ marginTop: "2em", fontSize: "0.8em", textAlign: "center", color: verificationResult.current['succeed'] ? "green" : "red" }}
        dangerouslySetInnerHTML={{ __html: results }}
      />

      {/* <div style={{ display: "block", textAlign: "center", marginTop: "1em" }}>
        <Link to="/receipts">View Receipts</Link>
      </div> */}
    </div>
  )
}
