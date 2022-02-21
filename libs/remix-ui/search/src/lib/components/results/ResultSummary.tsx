import React, { useContext } from 'react'
import { SearchContext } from '../../context/context'
import { SearchResult, SearchResultLine, SearchResultLineLine } from '../../types'

interface ResultSummaryProps {
  searchResult: SearchResult
  line: SearchResultLine
  setLoading: (value: boolean) => void
}

export const ResultSummary = (props: ResultSummaryProps) => {
  const { hightLightInPath, replaceText, state } = useContext(SearchContext)

  const selectLine = async (line: SearchResultLineLine) => {
    await hightLightInPath(props.searchResult, line)
  }

  const replace = async (line: SearchResultLineLine) => {
    props.setLoading(true)
    try{
      await replaceText(props.searchResult, line)
    }catch(e){
      props.setLoading(false) 
    }
  }

  return (
    <>
      {props.line.lines.map((lineItem, index) => (
        <div className='search_line_container' key={index}>
        <div
          onClick={async () => {
            selectLine(lineItem)
          }}
          key={props.searchResult.filename}
          className='search_line  pb-1'
        >
          <div className='summary_left'>{lineItem.left.substring(lineItem.left.length - 20).trimStart()}</div>
          <mark className={`summary_center ${state.replace? 'replace_strike':''}`}>{lineItem.center}</mark>
          {state.replace? <mark className='replacement'>{state.replace}</mark>:<></>}
          <div className='summary_right'>{lineItem.right.substring(0, 100)}</div>
        </div>
        <div className='search_control'>
        <div title="Replace" onClick={async () => {
            replace(lineItem)
          }} className="codicon codicon-find-replace" role="button" aria-label="Replace" aria-disabled="false"></div>
        </div>
        </div>
      ))}
    </>
  )
}
