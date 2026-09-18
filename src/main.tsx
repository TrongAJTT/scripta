import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EditorViewProvider } from './features/editor/context/EditorViewContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EditorViewProvider>
      <App />
    </EditorViewProvider>
  </StrictMode>,
)

