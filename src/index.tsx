import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

/* Theme */
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@theme';

/* Redux */
import { Provider } from 'react-redux';
import { persistor, store } from '@store';

/* React Query */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { PersistGate } from 'redux-persist/integration/react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
