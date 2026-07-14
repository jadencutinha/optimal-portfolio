import { useContext } from 'react'
import { ViewContext } from './context'

export function useView() {
  return useContext(ViewContext)
}
