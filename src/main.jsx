import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Lazy load Speed Insights to avoid blocking initial render
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then(module => ({ default: module.SpeedInsights }))
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Suspense fallback={null}>
      <SpeedInsights />
    </Suspense>
  </StrictMode>,
)
