import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App.tsx'
import './i18n'
import './index.css'
import './styles/theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter stellt die Navigation und den URL-Kontext bereit.
        Die eigentlichen Seiten definieren wir anschließend in App.tsx. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)