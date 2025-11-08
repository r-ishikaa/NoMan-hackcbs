import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, RefreshCw, Heart } from "lucide-react";
import API_CONFIG from "../../config/api";

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PeriodTracker = () => {
  const [periodSettings, setPeriodSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cycleLength: 28,
    periodLength: 5,
    lastPeriodDate: "",
    flow: "medium",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodLogs, setPeriodLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateModalData, setDateModalData] = useState({
    hasPeriod: false,
    periodDay: 1,
  });
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Fetch period settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(API_CONFIG.getApiUrl('/api/periods'), {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPeriodSettings(data);
          setFormData({
            cycleLength: data.cycleLength || 28,
            periodLength: data.periodLength || 5,
            lastPeriodDate: data.lastPeriodDate ? new Date(data.lastPeriodDate).toISOString().split('T')[0] : "",
            flow: data.flow || "medium",
          });
          // Always show form initially if no last period date, otherwise allow editing
          setShowForm(!data.lastPeriodDate);
          setIsEditingSettings(!data.lastPeriodDate);
        }
      } catch (error) {
        console.error('Failed to fetch period settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      if (!periodSettings) return;
      try {
        const res = await fetch(API_CONFIG.getApiUrl('/api/periods/summary'), {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      }
    };
    fetchSummary();
  }, [periodSettings, periodLogs]);

  // Fetch period logs for current month view (and adjacent months to show period spans)
  useEffect(() => {
    const fetchLogs = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      // Fetch logs for previous month, current month, and next month to handle period spans
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month + 2, 0);
      
      try {
        const res = await fetch(
          API_CONFIG.getApiUrl(`/api/periods/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
          {
            headers: authHeaders(),
          }
        );
        if (res.ok) {
          const logs = await res.json();
          setPeriodLogs(logs);
        }
      } catch (error) {
        console.error('Failed to fetch period logs:', error);
      }
    };
    fetchLogs();
  }, [currentDate, showDateModal, summary]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      // Don't send currentCycleStartDate - let backend decide based on whether
      // this is a new setup or an edit (to preserve historical data)
      const res = await fetch(API_CONFIG.getApiUrl('/api/periods'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          ...formData,
          // Only send currentCycleStartDate if this is first time setup
          ...(!periodSettings?.currentCycleStartDate && formData.lastPeriodDate ? {
            currentCycleStartDate: formData.lastPeriodDate
          } : {})
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPeriodSettings(data);
        setIsEditingSettings(false);
        // Refresh summary (only future predictions will update)
        const summaryRes = await fetch(API_CONFIG.getApiUrl('/api/periods/summary'), {
          headers: authHeaders(),
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }
      }
    } catch (error) {
      console.error('Failed to save period settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingLog = periodLogs.find(
      log => new Date(log.date).toISOString().split('T')[0] === dateStr
    );
    
    setSelectedDate(date);
    setDateModalData({
      hasPeriod: existingLog?.hasPeriod || false,
      periodDay: existingLog?.periodDay || 1,
    });
    setShowDateModal(true);
  };

  const handleSaveDateLog = async () => {
    if (!selectedDate) return;
    
    try {
      const res = await fetch(API_CONFIG.getApiUrl('/api/periods/logs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          hasPeriod: dateModalData.hasPeriod,
          periodDay: dateModalData.hasPeriod ? dateModalData.periodDay : null,
          flow: periodSettings?.flow || 'medium',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowDateModal(false);
        
        // If Day 1 was logged, fetch logs for a wider date range to include all auto-created logs
        if (dateModalData.hasPeriod && dateModalData.periodDay === 1) {
          // Fetch logs for a 2-month range to ensure we get all auto-created period days
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const startDate = new Date(year, month - 1, 1); // Previous month
          const endDate = new Date(year, month + 2, 0); // Next month
          
          const logsRes = await fetch(
            API_CONFIG.getApiUrl(`/api/periods/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
            { headers: authHeaders() }
          );
          if (logsRes.ok) {
            const logs = await logsRes.json();
            setPeriodLogs(logs);
          }
        } else {
          // For other dates, just refresh current month
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0);
          const logsRes = await fetch(
            API_CONFIG.getApiUrl(`/api/periods/logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
            { headers: authHeaders() }
          );
          if (logsRes.ok) {
            const logs = await logsRes.json();
            setPeriodLogs(logs);
          }
        }
        
        // Refresh summary
        const summaryRes = await fetch(API_CONFIG.getApiUrl('/api/periods/summary'), {
          headers: authHeaders(),
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(errorData.error || 'Failed to save period log. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save period log:', error);
      alert('Failed to save period log. Please try again.');
    }
  };

  const getPredictedPeriodDates = () => {
    if (!periodSettings || !summary) return [];
    const predicted = [];
    
    // Use cycle start date from summary
    let cycleStart = null;
    if (summary.cycleStartDate) {
      cycleStart = new Date(summary.cycleStartDate);
    } else if (periodSettings.lastPeriodDate) {
      cycleStart = new Date(periodSettings.lastPeriodDate);
    } else {
      return [];
    }
    
    cycleStart.setHours(0, 0, 0, 0);
    const cycleLength = periodSettings.cycleLength || 28;
    const periodLength = periodSettings.periodLength || 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate predicted periods starting from the next period date
    let nextPeriodStart = summary.nextPeriodDate 
      ? new Date(summary.nextPeriodDate)
      : new Date(cycleStart);
    
    if (!summary.nextPeriodDate) {
      // Calculate next period if not in summary
      nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
      
      // If it's in the past, move to future
      while (nextPeriodStart < today) {
        nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
      }
    }
    
    nextPeriodStart.setHours(0, 0, 0, 0);
    
    // Calculate predicted periods for the next 6 months
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    let currentPeriodStart = new Date(nextPeriodStart);
    while (currentPeriodStart <= sixMonthsFromNow) {
      // Only add FUTURE dates to predictions (past dates should not be predicted)
      // Add period days for this cycle
      for (let j = 0; j < periodLength; j++) {
        const date = new Date(currentPeriodStart);
        date.setDate(date.getDate() + j);
        // Only add if date is today or in the future
        if (date >= today) {
          predicted.push(date.toISOString().split('T')[0]);
        }
      }
      
      // Move to next cycle
      currentPeriodStart.setDate(currentPeriodStart.getDate() + cycleLength);
    }
    
    return predicted;
  };

  const isPredictedPeriodDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const predicted = getPredictedPeriodDates();
    return predicted.includes(dateStr);
  };

  const hasLoggedPeriod = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const log = periodLogs.find(
      log => new Date(log.date).toISOString().split('T')[0] === dateStr
    );
    return log?.hasPeriod || false;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-xl font-bold text-gray-900">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateStr = day.date.toISOString().split('T')[0];
            const isToday = day.date.getTime() === today.getTime();
            const isPredicted = isPredictedPeriodDate(day.date);
            const isLogged = hasLoggedPeriod(day.date);
            const isFuture = day.date > today;
            
            // Determine background color - logged periods should show pink background + purple dot
            // Predicted periods show light pink, logged periods show darker pink with purple dot
            let bgClass = '';
            if (isLogged) {
              bgClass = 'bg-pink-200'; // Darker pinkish-red for logged periods (will also have purple dot)
            } else if (isPredicted) {
              bgClass = 'bg-pink-100'; // Light pinkish-red for predicted periods only
            } else if (!day.isCurrentMonth) {
              bgClass = 'bg-transparent';
            } else {
              bgClass = 'bg-white';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`
                  relative h-12 w-12 rounded-full transition-all hover:scale-110 flex items-center justify-center
                  ${!day.isCurrentMonth && !isPredicted && !isLogged ? 'text-gray-300' : 'text-gray-900'}
                  ${isToday ? 'ring-2 ring-purple-400' : ''}
                  ${bgClass}
                  ${day.isCurrentMonth && !isLogged && !isPredicted ? 'hover:bg-gray-50' : ''}
                  border ${isLogged || isPredicted ? 'border-pink-300' : 'border-transparent'}
                `}
              >
                <span className={`text-sm font-medium`}>
                  {day.date.getDate()}
                </span>
                {isLogged && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-600 rounded-full z-10"></div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-100 border border-pink-300"></div>
              <span>Predicted Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-200 relative">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
              </div>
              <span>Period Days</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className="text-pink-600">ℹ</span>
            Tap a date on the calendar to log your mood, symptoms, and more
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-center text-gray-500">Loading period tracker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Form - Always visible, collapsible */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {periodSettings?.lastPeriodDate ? 'Period Settings' : 'Set Up Period Tracking'}
          </h3>
          {periodSettings?.lastPeriodDate && (
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 border border-pink-300 rounded-lg hover:bg-pink-50 transition"
            >
              {isEditingSettings ? 'Cancel' : 'Edit Settings'}
            </button>
          )}
        </div>
        
        {(showForm || isEditingSettings) ? (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Length (days)
              </label>
              <input
                type="number"
                min="21"
                max="35"
                value={formData.cycleLength}
                onChange={(e) => setFormData({ ...formData, cycleLength: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Length (days)
              </label>
              <input
                type="number"
                min="2"
                max="7"
                value={formData.periodLength}
                onChange={(e) => setFormData({ ...formData, periodLength: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Period Date
              </label>
              <input
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => setFormData({ ...formData, lastPeriodDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow
              </label>
              <select
                value={formData.flow}
                onChange={(e) => setFormData({ ...formData, flow: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition"
            >
              Save Settings
            </button>
          </form>
        ) : periodSettings ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Cycle Length</span>
              <span className="text-gray-900 font-semibold">{periodSettings.cycleLength || 28} days</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Period Length</span>
              <span className="text-gray-900 font-semibold">{periodSettings.periodLength || 5} days</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Last Period Date</span>
              <span className="text-gray-900 font-semibold">
                {periodSettings.lastPeriodDate 
                  ? new Date(periodSettings.lastPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">Flow</span>
              <span className="text-gray-900 font-semibold capitalize">{periodSettings.flow || 'Medium'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Current Period Status - Show if user has logged period for today */}
      {summary && (() => {
        const today = new Date();
        const todayLog = periodLogs.find(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime() && log.hasPeriod;
        });
        return todayLog && todayLog.periodDay;
      })() && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 text-center border border-pink-100 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
          </div>
          <div className="text-lg text-gray-700 mb-2">Period:</div>
          <div className="text-5xl font-bold text-gray-900 mb-6">
            Day {(() => {
              const today = new Date();
              const todayLog = periodLogs.find(log => {
                const logDate = new Date(log.date);
                logDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                return logDate.getTime() === today.getTime() && log.hasPeriod;
              });
              return todayLog?.periodDay || summary.currentCycleDay;
            })()}
          </div>
          <button
            onClick={() => {
              const today = new Date();
              handleDateClick(today);
            }}
            className="px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition shadow-md"
          >
            Quick Check-In
          </button>
        </div>
      )}

      {/* Calendar */}
      {renderCalendar()}

      {/* Cycle Summary */}
      {summary && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4" style={{ borderTopColor: '#ec4899' }}>
          <h3 className="text-2xl font-bold mb-6" style={{ color: '#ec4899' }}>Cycle Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-5 h-5" style={{ color: '#db2777' }} />
                <span className="text-sm text-gray-600 font-medium">Next Period</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.nextPeriodDate
                  ? new Date(summary.nextPeriodDate).getDate() + 'th ' + 
                    new Date(summary.nextPeriodDate).toLocaleString('default', { month: 'short' })
                  : '—'}
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" style={{ color: '#d97706' }} />
                <span className="text-sm text-gray-600 font-medium">Period Length</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.periodLength}</div>
            </div>
            
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5" style={{ color: '#db2777' }} />
                <span className="text-sm text-gray-600 font-medium">Cycle Day</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.currentCycleDay ? `Day ${summary.currentCycleDay}` : '—'}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5" style={{ color: '#2563eb' }} />
                <span className="text-sm text-gray-600 font-medium">Cycle Length</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{summary.cycleLength}</div>
            </div>
          </div>
        </div>
      )}

      {/* Date Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dateModalData.hasPeriod}
                    onChange={(e) => setDateModalData({ ...dateModalData, hasPeriod: e.target.checked })}
                    className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                  />
                  <span className="text-gray-700">I have my period on this date</span>
                </label>
              </div>
              
              {dateModalData.hasPeriod && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which day of your period is this?
                  </label>
                  <select
                    value={dateModalData.periodDay}
                    onChange={(e) => setDateModalData({ ...dateModalData, periodDay: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>Day {day}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDateLog}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodTracker;

