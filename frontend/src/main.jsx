import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pushNotifications.js'
import { initializeBrowserNotifications } from './utils/browserNotifications.js'
import { logNotificationStatus } from './utils/checkNotificationStatus.js'

// Register service worker and initialize notifications on app load
if ('serviceWorker' in navigator) {
  registerServiceWorker()
    .then(() => {
      console.log('✅ Service worker registered successfully');
      // Log notification status after a short delay to allow subscription
      setTimeout(() => {
        try {
          logNotificationStatus();
        } catch (err) {
          console.error('Error logging notification status:', err);
        }
      }, 2000);
    })
    .catch((err) => {
      console.error('❌ Failed to register service worker:', err);
    });
} else {
  console.warn('⚠️ Service workers not supported in this browser');
}

// Initialize browser notifications
initializeBrowserNotifications().catch((err) => {
  console.error('Failed to initialize browser notifications:', err);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)