import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EditorViewProvider } from './features/editor/context/EditorViewContext.tsx'
import { initDevConsoleBridge } from './core/dev/devConsoleBridge.ts'

if (import.meta.env.DEV) {
  initDevConsoleBridge();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EditorViewProvider>
      <App />
    </EditorViewProvider>
  </StrictMode>,
)

