import React from 'react'
import { NavLink } from 'react-router-dom'

interface NavItemProps {
  to: string
  icon: JSX.Element
  title: string
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, title }) => {
  return (
    <NavLink to={to} className={({ isActive }) => 'text-decoration-none d-flex flex-column justify-content-center py-2 px-1 small ' + (isActive ? 'bg-light' : 'bg-transparent')}>
      <span>
        <span>{icon}</span>
        <span className="ml-2">{title}</span>
      </span>
    </NavLink>
  )
}

export const NavMenu = () => {
  return (
    <nav className="d-flex flex-row justify-start w-100">
      <NavItem to="/" icon={<i className="fas fa-search"></i>} title="GetABI" />
      <NavItem to="/interact" icon={<i className="fas fa-paper-plane"></i>} title="Interact" />
      <NavItem to="/settings" icon={<i className="fas fa-cog"></i>} title="Settings" />
      <div className="flex-grow-1"></div>
    </nav>
  )
}
