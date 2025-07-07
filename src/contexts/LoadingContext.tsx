import { useToken } from '@chakra-ui/react'
import { createContext, memo, useCallback, useRef } from 'react'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

export interface LoadingContextValues {
  start: () => void
  complete: () => void
}

export const LoadingContext = createContext<LoadingContextValues>({
  start: () => {},
  complete: () => {}
})

const LoadingContextProvider = ({ children }: { children: any }) => {
  const primaryColor = useToken('colors', 'primary')

  /* Ref */
  const loadingBarRef = useRef<LoadingBarRef>(null)

  /* Handlers */
  const onStartHandler = useCallback(() => {
    loadingBarRef.current?.continuousStart()
  }, [])
  const onCompleteHandler = useCallback(() => {
    loadingBarRef.current?.complete()
  }, [])

  return (
    <LoadingContext.Provider
      value={{ start: onStartHandler, complete: onCompleteHandler }}
    >
      <LoadingBar ref={loadingBarRef} color={primaryColor} />
      {children}
    </LoadingContext.Provider>
  )
}

export default memo(LoadingContextProvider)
