import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API_CONFIG from '../config/api';
import { User, Sparkles, Building2, Check } from 'lucide-react';

const RoleSwitcher = () => {
  const { user, role, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const roles = [
    { value: 'user', label: 'Normal User', icon: User, description: 'Standard account' },
    { value: 'creator', label: 'Creator', icon: Sparkles, description: 'For content creators' },
    { value: 'enterprise', label: 'Enterprise', icon: Building2, description: 'For businesses' },
  ];

  const switchRole = async (newRole) => {
    if (newRole === role) {
      setMessage('You are already on this role');
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('hexagon_token') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('jwt');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(API_CONFIG.getApiUrl('/users/me/role'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch role');
      }

      const data = await response.json();
      setMessage(`Successfully switched to ${data.user.role} role!`);
      
      // Refresh user data and reload page to ensure UI updates
      if (refreshUser) {
        await refreshUser();
      }
      
      // Always reload to ensure all components update with new role
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Role switch error:', error);
      setMessage(error.message || 'Failed to switch role');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const currentRoleInfo = roles.find(r => r.value === role);

  return (
    <div className="relative">
      {/* Current Role Badge */}
      <button
        onClick={() => setShowSwitcher(!showSwitcher)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
        disabled={loading}
      >
        {currentRoleInfo && (
          <>
            <currentRoleInfo.icon className="w-4 h-4" />
            <span className="font-medium">{currentRoleInfo.label}</span>
          </>
        )}
        <span className="text-xs">({role})</span>
        {!currentRoleInfo && <span>Role: {role}</span>}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 z-50 px-4 py-2 rounded-lg text-sm ${
            message.includes('Successfully')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Role Switcher Dropdown */}
      {showSwitcher && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mb-2">
              Switch Account Type
            </div>
            {roles.map((roleOption) => {
              const Icon = roleOption.icon;
              const isCurrent = roleOption.value === role;
              return (
                <button
                  key={roleOption.value}
                  onClick={() => switchRole(roleOption.value)}
                  disabled={loading || isCurrent}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-violet-50 text-violet-700 cursor-not-allowed'
                      : 'hover:bg-gray-50 text-gray-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{roleOption.label}</div>
                    <div className="text-xs text-gray-500">{roleOption.description}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-violet-600" />}
                </button>
              );
            })}
          </div>
          {role === 'creator' && (
            <div className="border-t border-gray-200 p-3 bg-blue-50">
              <a
                href="/activity"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                📊 Go to Activity Center
              </a>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showSwitcher && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher;

