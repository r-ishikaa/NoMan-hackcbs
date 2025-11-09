import { useAuth0 } from '@auth0/auth0-react'

const Auth0LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return (
      <button 
        disabled
        className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
      >
        Loading Auth0...
      </button>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
    >
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.98 7.448L19.62 0H4.347L2.02 7.448c-1.352 4.312.03 9.206 3.815 12.015L12.007 24l6.157-4.537c3.785-2.809 5.167-7.703 3.815-12.015zm-6.84 8.866a.63.63 0 01-.63.631h-3.034a.63.63 0 01-.63-.631v-3.034a.63.63 0 01.63-.631h3.034a.63.63 0 01.63.631v3.034zm0-5.783a.63.63 0 01-.63.631h-3.034a.63.63 0 01-.63-.631V7.497a.63.63 0 01.63-.631h3.034a.63.63 0 01.63.631v3.034z"/>
        </svg>
        <span>Continue with Auth0</span>
      </div>
    </button>
  )
}

export default Auth0LoginButton

