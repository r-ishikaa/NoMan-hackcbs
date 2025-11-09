import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import './i18n/config'
import App from './App.jsx'

// Auth0 configuration (optional - only if configured)
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE

// Check if Auth0 is configured
const isAuth0Configured = auth0Domain && auth0ClientId && 
  auth0Domain !== 'your-domain.auth0.com' && 
  auth0ClientId !== 'your-client-id'

const AppWrapper = () => {
  if (isAuth0Configured) {
    return (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin + '/auth/auth0/callback',
          audience: auth0Audience,
        }}
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    )
  }
  
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </StrictMode>,
)