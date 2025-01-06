// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react'
import { environmentExplorerUIGridSections, environmentExplorerUIProps } from '../types'
import { RemixUIGridCell, RemixUIGridSection, RemixUIGridView } from '@remix-ui/remix-ui-grid-view'
import { CustomTooltip } from '@remix-ui/helper'

const defaultSections: environmentExplorerUIGridSections = {
  Injected: {
    title: 'Deploy using a Browser Extension.',
    keywords: ['Injected'],
    providers: [],
    filterFn: (provider) => provider.isInjected
  },
  'Remix VMs': {
    title: 'Deploy to an In-browser Virtual Machine.',
    keywords: ['Remix VMs'],
    providers: [],
    filterFn: (provider) => provider.isVM && !provider.isForkedVM
  },
  'Forked States': {
    title: 'Deploy to an In-browser Forked State.',
    keywords: ['Forked State'],
    providers: [],
    filterFn: (provider) => provider.isForkedState,
    descriptionFn: (provider) => {
      const { latestBlock, timestamp } = JSON.parse(provider.description)
      return (
        <>
          <div><b>Latest Block: </b>{parseInt(latestBlock)}</div>
          <CustomTooltip
            placement="auto"
            tooltipId="overlay-tooltip-forkedAt"
            tooltipText={`Forked at: ${(new Date(timestamp)).toLocaleString()}`}
          >
            <div><b>Forked at: </b>{(new Date(timestamp)).toDateString()}</div>
          </CustomTooltip>
        </>)
    }
  },
  'Remix forked VMs': {
    title: 'Deploy to a Remix forked Virtual Machine.',
    keywords: ['Remix forked VMs'],
    providers: [],
    filterFn: (provider) => provider.isForkedVM
  },
  'Externals': {
    title: 'Deploy to an external Provider.',
    keywords: ['Externals'],
    providers: [],
    filterFn: (provider) => (!provider.isInjected && !provider.isVM && !provider.isForkedState && !provider.isForkedVM)
  },
}
export const EnvironmentExplorerUI = (props: environmentExplorerUIProps) => {

  const [sections, setSections] = useState(defaultSections)
  const { state, pinStateCallback, profile } = props

  useEffect(() => {

    setSections((prevSections) => {
      const newSections = { ...prevSections }
      Object.keys(newSections).forEach((section) => {
        newSections[section].providers = Object.values(state.providersFlat).filter(newSections[section].filterFn)
        newSections[section].id = section
      })
      return newSections
    })
  }, [state])

  return (
    <>
      <RemixUIGridView
        plugin={null}
        styleList={""}
        logo={profile.icon}
        enableFilter={true}
        showUntagged={true}
        showPin={true}
        title={profile.description}
        description="Select the providers and chains to include them in the ENVIRONMENT select box of the Deploy & Run Transactions plugin."
      >
        {Object.values(sections).map((section) => (
          section.providers.length > 0 && (
            <RemixUIGridSection
              plugin={this}
              title={section.title}
              hScrollable={false}
              key={section.title}
            >
              {section.providers.map(provider => (
                <RemixUIGridCell
                  plugin={this}
                  title={provider.displayName}
                  logos={provider.logos}
                  classList='EECellStyle'
                  searchKeywords={['Injected', provider.name, provider.displayName, provider.title, provider.description]}
                  pinned={state.pinnedProviders.includes(provider.name)}
                  key={provider.name}
                  id={provider.name}
                  pinStateCallback={async (pinned: boolean) => {
                    await pinStateCallback(provider, pinned)
                  }}
                >
                  <div data-id={`${provider.name}desc`}>{(section.descriptionFn && section.descriptionFn(provider)) || provider.description}</div>
                </RemixUIGridCell>
              ))}
            </RemixUIGridSection>
          )
        ))}
      </RemixUIGridView>
    </>
  )
}
