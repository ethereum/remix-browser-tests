import { createContext } from 'react'
import { INoirAppContext } from '../types'

export const NoirAppContext = createContext<INoirAppContext>({} as INoirAppContext)
