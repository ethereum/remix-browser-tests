// eslint-disable-next-line no-use-before-define
import React from 'react'
import parse from 'html-react-parser'
import { ScanReport } from './types'
const _paq = (window._paq = window._paq || [])

interface SolScanTableProps {
  scanReport: ScanReport
  fileName: string
}

export function SolScanTable(props: SolScanTableProps) {
  const { scanReport, fileName } = props
  const { multi_file_scan_details, multi_file_scan_summary } = scanReport

  return (
    <>
      <br/>
      <h6>SolidityScan result for <b>{fileName}</b>:</h6>
      <table className="table table-bordered table-hover">
        <thead>
          <tr>
            <td scope="col" style={{ wordBreak: "keep-all" }}>#</td>
            <td scope="col" style={{ wordBreak: "keep-all" }}>NAME</td>
            <td scope="col" style={{ wordBreak: "keep-all" }}>SEVERITY</td>
            <td scope="col" style={{ wordBreak: "keep-all" }}>CONFIDENCE</td>
            <td scope="col" style={{ wordBreak: "keep-all" }}>DESCRIPTION</td>
            <td scope="col" style={{ wordBreak: "keep-all" }}>REMEDIATION</td>
          </tr>
        </thead>
        <tbody>
          {
            Array.from(multi_file_scan_details, (template, index) => {
              return (
                <tr key={template.template_details.issue_id}>
                  <td scope="col">{index + 1}.</td>
                  <td scope="col">{template.template_details.issue_name}</td>
                  <td scope="col">{template.template_details.issue_severity}</td>
                  <td scope="col">{template.template_details.issue_confidence}</td>
                  <td scope="col">{parse(template.template_details.static_issue_description)}</td>
                  <td scope="col">{template.template_details.issue_remediation ? parse(template.template_details.issue_remediation) : 'Not Available' }</td>
                </tr>
              )
            })
          }

        </tbody>
      </table>
      <p className='text-success'><b> warnings </b> found. See the warning details below. For more details,&nbsp;
        <a href="https://solidityscan.com/signup"
          target='_blank'
          onClick={() => _paq.push(['trackEvent', 'solidityCompiler', 'solidityScan', 'goToSolidityScan'])}>
            go to SolidityScan.
        </a>
      </p>
    </>
  )
}
