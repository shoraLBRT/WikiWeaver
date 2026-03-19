import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { LocalizationProvider } from './localization/provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalizationProvider>
      <App />
    </LocalizationProvider>
  </StrictMode>,
)
