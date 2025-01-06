// The forwardRef is important!!

import React, { Ref } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { CustomTooltip } from '@remix-ui/helper'

// Dropdown needs access to the DOM node in order to position the Menu
export const CustomToggle = React.forwardRef(
  (
    {
      children,
      onClick,
      icon,
      className = ''
    }: {
      children: React.ReactNode
      onClick: (e) => void
      icon: string
      className: string
    },
    ref: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        onClick(e)
      }}
      className={className.replace('dropdown-toggle', '')}
    >
      <div className="d-flex">
        <div className="mr-auto text-nowrap text-truncate overflow-hidden" data-id={`dropdown-content`}>{children}</div>
        {icon && (
          <div className="pr-1">
            <i className={`${icon} pr-1`}></i>
          </div>
        )}
        <div>
          <i className="fad fa-sort-circle"></i>
        </div>
      </div>
    </button>
  )
)

export const CustomIconsToggle = React.forwardRef(
  (
    {
      onClick,
      icon,
      className = ''
    }: {
      children?: React.ReactNode
      onClick: () => void
      icon: string
      className: string
    },
    ref: Ref<HTMLSpanElement>
  ) => (
    <span
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`${className.replace('dropdown-toggle', '')} mr-1 mb-0 pb-0 d-flex justify-content-end align-items-end remixuimenuicon_shadow remixuimenuicon_hamburger_menu fs-3`}
      data-id="workspaceMenuDropdown"
    >
      {icon && (
        <CustomTooltip
          placement={'top'}
          tooltipClasses="text-nowrap text-left"
          tooltipId="remixHamburgerTooltip"
          tooltipText={<FormattedMessage id="filePanel.workspaceActions" />}
        >
          <i style={{ fontSize: 'large' }} className={`${icon}`} data-id="workspaceDropdownMenuIcon"></i>
        </CustomTooltip>
      )}
    </span>
  )
)

// forwardRef again here!
// Dropdown needs access to the DOM of the Menu to measure it
export const CustomMenu = React.forwardRef(
  (
    {
      children,
      style,
      'data-id': dataId,
      className,
      'aria-labelledby': labeledBy
    }: {
      'children': React.ReactNode
      'style'?: React.CSSProperties
      'data-id'?: string
      'className': string
      'aria-labelledby'?: string
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const height = window.innerHeight * 0.6
    return (
      <div ref={ref} style={style} className={className} aria-labelledby={labeledBy} data-id={dataId}>
        <ul className="overflow-auto list-unstyled mb-0" style={{ maxHeight: height + 'px' }}>
          {children}
        </ul>
      </div>
    )
  }
)

export const ProxyAddressToggle = React.forwardRef(
  (
    {
      address,
      onClick,
      className = '',
      onChange
    }: {
      address: string
      onClick: (e) => void
      className: string
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const intl = useIntl()
    return (
      <div
        ref={ref}
        onClick={(e) => {
          e.preventDefault()
          onClick(e)
        }}
        className={'d-flex ' + className.replace('dropdown-toggle', '')}
        data-id="toggleProxyAddressDropdown"
      >
        <input
          onChange={(e) => {
            e.preventDefault()
            onChange(e)
          }}
          className="udapp_input form-control"
          value={address}
          placeholder={intl.formatMessage({ id: 'udapp.enterProxyAddress' })}
          style={{ width: '100%' }}
          data-id="ERC1967AddressInput"
        />
      </div>
    )
  }
)

export const ProxyDropdownMenu = React.forwardRef(
  (
    {
      children,
      style,
      className,
      'aria-labelledby': labeledBy
    }: {
      'children': React.ReactNode
      'style'?: React.CSSProperties
      'className': string
      'aria-labelledby'?: string
    },
    ref: Ref<HTMLDivElement>
  ) => {
    return (
      <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
        <ul className="list-unstyled mb-0">{children}</ul>
      </div>
    )
  }
)
