import React, { createContext, useContext, useState, useEffect } from 'react'
import API_CONFIG from '../config/api.js'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [role, setRole] = useState(null)

  // Check for existing token on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('hexagon_token')
    if (storedToken) {
      setToken(storedToken)
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (authToken) => {
    if (!authToken) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(API_CONFIG.getApiUrl('/users/me'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        // Add cache control to prevent excessive requests
        cache: 'no-cache'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setRole(userData.role || null)
      } else if (response.status === 401) {
        // Token is invalid or expired, remove it
        console.log('Token expired or invalid, logging out')
        localStorage.removeItem('hexagon_token')
        setToken(null)
        setUser(null)
        setRole(null)
      } else if (response.status === 429) {
        // Rate limited - don't clear token, just log and retry later
        console.warn('Rate limited when fetching profile, will retry on next mount')
        // Keep the token and user state, just stop loading
      } else {
        // Other error
        console.error('Failed to fetch user profile:', response.status, response.statusText)
        // Only clear auth on critical errors (not rate limiting)
        if (response.status >= 500) {
          // Server error - keep token, might be temporary
          console.log('Server error, keeping token for retry')
        } else {
          // Client error (4xx) - clear auth
        localStorage.removeItem('hexagon_token')
        setToken(null)
        setUser(null)
        setRole(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // Network error - keep token, might be temporary connection issue
      console.log('Network error, keeping token for retry')
    } finally {
      setLoading(false)
    }
  }

  const login = async (authToken) => {
    setToken(authToken)
    localStorage.setItem('hexagon_token', authToken)
    await fetchUserProfile(authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setRole(null)
    localStorage.removeItem('hexagon_token')
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const hasRole = (requiredRole) => {
    if (!requiredRole) return true
    return role === requiredRole
  }

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('hexagon_token')
    if (storedToken) {
      await fetchUserProfile(storedToken)
    }
  }

  const value = {
    user,
    token,
    loading,
    role,
    login,
    logout,
    isAuthenticated,
    hasRole,
    fetchUserProfile,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      <div data-role={role || 'guest'}>
        {children}
      </div>
    </AuthContext.Provider>
  )
}
