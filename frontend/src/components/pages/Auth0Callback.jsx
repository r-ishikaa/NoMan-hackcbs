import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import API_CONFIG from '../../config/api'

const Auth0Callback = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const handleAuth0Login = async () => {
      if (isLoading || processing) return
      
      if (!isAuthenticated) {
        setError('Authentication failed')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      setProcessing(true)

      try {
        // Get Auth0 access token
        const auth0Token = await getAccessTokenSilently()
        
        // Exchange Auth0 token via College Auth Service
        const collegeAuthUrl = import.meta.env.VITE_COLLEGE_AUTH_URL || 'http://localhost:5004'
        const response = await fetch(`${collegeAuthUrl}/auth/college/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth0_token: auth0Token,
            email: user.email,
            name: user.name,
            picture: user.picture,
            sub: user.sub,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to exchange token')
        }

        // Use your existing auth context to store the token
        login(data.access_token)
        
        // Redirect to profile
        navigate('/profile')
      } catch (err) {
        console.error('Auth0 callback error:', err)
        setError(err.message)
        setTimeout(() => navigate('/login'), 3000)
      } finally {
        setProcessing(false)
      }
    }

    handleAuth0Login()
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently, login, navigate, processing])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Completing Sign In</h2>
          <p className="text-gray-300">Please wait while we set up your account...</p>
        </div>
      </div>
    </div>
  )
}

export default Auth0Callback

