import { PropsWithChildren } from 'react'

import { NavMenu } from '../components/NavMenu'

interface Props {
  from: string
  title?: string
  description?: string
}

export const DefaultLayout = ({ children, title, description }: PropsWithChildren<Props>) => {
  return (
    <div className="d-flex flex-column h-100">
      <NavMenu />
      <div className="py-4 px-3 flex-grow-1" style={{ overflowY: 'auto' }}>
        <div>
          <p className="text-center" style={{ fontSize: '0.8rem' }}>
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
