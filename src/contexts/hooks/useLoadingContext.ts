import { LoadingContext } from '@contexts/LoadingContext'
import { useContext } from 'react'

export const useLoadingContext = () => {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error(
      'useLoadingContext must be used within a LoadingContextProvider'
    )
  }
  return context
}
