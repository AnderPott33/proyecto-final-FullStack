import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/AuthContext";
import { CajaProvider } from './context/CajaContext.jsx';
import './index.css'
import './tailwind.css'
import App from './App.jsx'

createRoot(document.querySelector('#root')).render(
  <AuthProvider>
    <CajaProvider>
        <App />
    </CajaProvider>
  </AuthProvider>
)