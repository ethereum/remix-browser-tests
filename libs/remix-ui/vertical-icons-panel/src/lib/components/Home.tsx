import { CustomTooltip } from '@remix-ui/helper'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import BasicLogo from './BasicLogo'

interface HomeProps {
  verticalIconPlugin: any
  disableClick?: boolean
}

function Home({ verticalIconPlugin, disableClick }: HomeProps) {
  const handleClick = async () => {
    if (!disableClick) {
      await verticalIconPlugin.activateHome()
    }
  }

  return (
    <>
      {disableClick ? (
        <div
          className="mt-2 my-1 remixui_homeIcon"
          data-id="verticalIconsHomeIcon"
          id="verticalIconsHomeIcon"
        >
          <BasicLogo />
        </div>
      ) : (
        <CustomTooltip placement="right" tooltipText={<FormattedMessage id='home.home' />}>
          <div
            className="mt-2 my-1 remixui_homeIcon"
            onClick={handleClick}
            {...{ plugin: 'home' }}
            data-id="verticalIconsHomeIcon"
            id="verticalIconsHomeIcon"
          >
            <BasicLogo />
          </div>
        </CustomTooltip>
      )}
    </>
  )
}

export default Home
