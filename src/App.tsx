import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from '@routes'
import LoadingContextProvider from '@contexts/LoadingContext'

function App() {
  return (
    <LoadingContextProvider>
      <RouterProvider router={router} />
    </LoadingContextProvider>
  )
}

export default App
