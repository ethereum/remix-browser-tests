import React from 'react'
import { NavLink } from 'react-router-dom'
import { useIntl, FormattedMessage } from 'react-intl'

interface NavItemProps {
  to: string
  icon: JSX.Element
  title: string | any
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, title }) => {
  const intl = useIntl()
  return (
    <NavLink
      data-id={`${title}Tab`}
      to={to}
      className={({ isActive }) => 'text-decoration-none d-flex px-1 py-1 flex-column justify-content-center small ' + (isActive ? "bg-light border-top border-left border-right" : "border-0 bg-transparent")}
    >
      <span className=''>
        <span>{icon}</span>
        <span className="ml-2">{title}</span>
      </span>
    </NavLink>
  )
}

export const NavMenu = () => {
  return (
    <nav className="d-flex medium flex-row w-100" style={{ backgroundColor: 'var(--body-bg)!important' }}>
      <NavItem to="/" icon={<i className="fas fa-home"></i>} title={ <FormattedMessage id="contract-verification.verifyNavTitle" defaultMessage={'Verify'} /> } />
      <NavItem to="/receipts" icon={<i className="fas fa-receipt"></i>} title={ <FormattedMessage id="contract-verification.receiptsNavTitle" defaultMessage={'Receipts'} /> } />
      <NavItem to="/lookup" icon={<i className="fas fa-search"></i>} title={ <FormattedMessage id="contract-verification.lookupNavTitle" defaultMessage={'Lookup'} /> } />
      <NavItem to="/settings" icon={<i className="fas fa-cog"></i>} title={ <FormattedMessage id="contract-verification.settingsNavTitle" defaultMessage={'Settings'} /> } />
    </nav>
  )
}
