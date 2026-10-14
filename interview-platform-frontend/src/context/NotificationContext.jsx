import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import experienceApi from '../api/experienceApi'
import { chatApi } from '../api/chatApi'
import { getToken } from '../utils/storage'

const NotificationContext = createContext(null)

// The 3 strictly permitted persistent notification categories
export const NOTIFICATION_CATEGORIES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  EXPERIENCE_SHARED: 'EXPERIENCE_SHARED',
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Notifications stored per user session, filtered strictly to the 3 permitted categories
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewhub_notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Strict filter: only LOGIN_SUCCESS, CHAT_MESSAGE, and EXPERIENCE_SHARED
          return parsed.filter((n) =>
            n.category === NOTIFICATION_CATEGORIES.LOGIN_SUCCESS ||
            n.category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE ||
            n.category === NOTIFICATION_CATEGORIES.EXPERIENCE_SHARED
          )
        }
      }
    } catch {
      // Fallback
    }
    return []
  })

  // Persist notifications list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('interviewhub_notifications', JSON.stringify(notifications))
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e)
    }
  }, [notifications])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /**
   * Dispatches a floating toast notification.
   * ONLY saves to persistent notifications tray if category is LOGIN_SUCCESS, CHAT_MESSAGE, or EXPERIENCE_SHARED.
   */
  const showToast = useCallback(({
    type = 'info',
    title = '',
    message = '',
    duration = 4500,
    category = null,
    saveToHistory = false,
  }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7)
    const newToast = { id, type, title, message }

    setToasts((prev) => [...prev, newToast])

    // Strict condition: only persist if category is one of the 3 approved categories, or explicit saveToHistory
    const isApprovedCategory =
      category === NOTIFICATION_CATEGORIES.LOGIN_SUCCESS ||
      category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE ||
      category === NOTIFICATION_CATEGORIES.EXPERIENCE_SHARED ||
      saveToHistory

    if (isApprovedCategory) {
      setNotifications((prev) => {
        // Prevent exact duplicates within a short window
        const isDuplicate = prev.some(
          (n) => n.title === title && n.message === message && Date.now() - new Date(n.createdAt).getTime() < 8000
        )
        if (isDuplicate) return prev

        return [
          {
            id,
            type,
            title: title || (type === 'success' ? 'Success' : 'Notification'),
            message,
            category: category || NOTIFICATION_CATEGORIES.LOGIN_SUCCESS,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 39), // keep latest 40
        ]
      })
    }

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }, [dismissToast])

  /**
   * Helper: Dispatches "Login Successful" notification
   */
  const recordLoginNotification = useCallback((userName) => {
    const name = userName || 'Candidate'
    showToast({
      type: 'success',
      title: 'Login Successful 🎉',
      message: `Welcome back, ${name}! You have signed in successfully.`,
      category: NOTIFICATION_CATEGORIES.LOGIN_SUCCESS,
      saveToHistory: true,
      duration: 4000,
    })
  }, [showToast])

  /**
   * Helper: Dispatches "New Chat Message" notification
   */
  const recordChatMessage = useCallback((senderName, message) => {
    showToast({
      type: 'info',
      title: `New Message from ${senderName || 'Peer'} 💬`,
      message: message || 'Sent you a new direct message.',
      category: NOTIFICATION_CATEGORIES.CHAT_MESSAGE,
      saveToHistory: true,
      duration: 5000,
    })
  }, [showToast])

  /**
   * Helper: Dispatches "New Experience Shared" notification
   */
  const recordExperienceShared = useCallback((exp) => {
    const author = exp.authorName || exp.user?.name || 'A candidate'
    const company = exp.company?.name || exp.companyName || exp.company || 'Tech Company'
    const role = exp.jobRole || 'Software Engineer'

    showToast({
      type: 'success',
      title: 'New Experience Shared 🚀',
      message: `${author} shared an interview experience for ${company} (${role})!`,
      category: NOTIFICATION_CATEGORIES.EXPERIENCE_SHARED,
      saveToHistory: true,
      duration: 6000,
    })
  }, [showToast])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Clear all persistent notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Track latest experience ID to notify all users when anyone shares an experience
  const lastKnownExpIdRef = useRef(null)

  useEffect(() => {
    // Initialize or load last known experience ID
    const storedExpId = localStorage.getItem('interviewhub_last_known_exp_id')
    if (storedExpId) {
      lastKnownExpIdRef.current = Number(storedExpId)
    }

    const checkForNewExperiences = async () => {
      try {
        const res = await experienceApi.getExperiences({ page: 0, size: 4, sort: 'id,desc' })
        const paged = res?.data || res || {}
        const items = paged.content || (Array.isArray(paged) ? paged : [])
        if (!items || items.length === 0) return

        const highestId = Math.max(...items.map((e) => e.id || 0))

        if (lastKnownExpIdRef.current === null) {
          // Initial baseline load on first mount
          lastKnownExpIdRef.current = highestId
          localStorage.setItem('interviewhub_last_known_exp_id', String(highestId))
        } else if (highestId > lastKnownExpIdRef.current) {
          // One or more new experiences shared!
          const newItems = items.filter((e) => e.id > lastKnownExpIdRef.current)
          newItems.reverse().forEach((newItem) => {
            recordExperienceShared({
              authorName: newItem.user?.name || 'A candidate',
              companyName: newItem.company?.name || newItem.companyName,
              jobRole: newItem.jobRole,
            })
          })

          lastKnownExpIdRef.current = highestId
          localStorage.setItem('interviewhub_last_known_exp_id', String(highestId))
        }
      } catch (err) {
        // Silent error in background polling
      }
    }

    // Run initial check
    checkForNewExperiences()

    // Poll every 18 seconds for newly published experiences
    const expInterval = setInterval(checkForNewExperiences, 18000)

    // Also listen for same-window / cross-tab broadcast events
    const handleBroadcastExp = (e) => {
      if (e.detail) {
        recordExperienceShared(e.detail)
      }
    }

    const handleStorageEvent = (e) => {
      if (e.key === 'interviewhub_experience_published_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          recordExperienceShared(parsed)
        } catch {}
      }
    }

    window.addEventListener('interviewhub_experience_published', handleBroadcastExp)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      clearInterval(expInterval)
      window.removeEventListener('interviewhub_experience_published', handleBroadcastExp)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [recordExperienceShared])

  // Track incoming chat messages for currently logged-in user
  const lastKnownChatMessagesRef = useRef({})

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const checkIncomingChats = async () => {
      try {
        const currentToken = getToken()
        if (!currentToken) return

        const res = await chatApi.getConversations()
        const convList = res?.data?.data || res?.data || []
        if (!Array.isArray(convList)) return

        convList.forEach((conv) => {
          if (!conv.contactId || !conv.lastMessage) return

          const prevMsgTime = lastKnownChatMessagesRef.current[conv.contactId]
          const currentMsgTime = conv.lastMessageTime || conv.lastMessage

          if (prevMsgTime === undefined) {
            // Baseline initialization
            lastKnownChatMessagesRef.current[conv.contactId] = currentMsgTime
          } else if (prevMsgTime !== currentMsgTime && conv.unreadCount > 0) {
            // New incoming message!
            lastKnownChatMessagesRef.current[conv.contactId] = currentMsgTime
            recordChatMessage(conv.contactName, conv.lastMessage)
          }
        })
      } catch {
        // Silent background check
      }
    }

    // Run check every 12 seconds
    const chatInterval = setInterval(checkIncomingChats, 12000)

    return () => clearInterval(chatInterval)
  }, [recordChatMessage])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        notifications,
        unreadCount,
        showToast,
        dismissToast,
        markAllAsRead,
        clearNotifications,
        recordLoginNotification,
        recordChatMessage,
        recordExperienceShared,
      }}
    >
      {children}

      {/* Floating Toast Alerts Container */}
      <aside
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          maxWidth: '380px',
          width: 'calc(100vw - 2.5rem)',
          pointerEvents: 'none',
        }}
        id="toast-notifications-container"
        aria-live="polite"
        aria-label="Notification alerts"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          const isError = toast.type === 'error'
          const isWarning = toast.type === 'warning'

          const borderColor = isSuccess ? '#10b981' : isError ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6'
          const bgGradient = isSuccess
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.94) 100%)'
            : isError
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.94) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.94) 100%)'

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                background: bgGradient,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${borderColor}`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#f8fafc',
              }}
              className="toast-alert-card"
            >
              {/* Type Icon */}
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: borderColor,
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginTop: '0.1rem',
                }}
              >
                {isSuccess ? '✓' : isError ? '!' : 'ℹ'}
              </div>

              {/* Toast Text Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.2rem', color: '#ffffff' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', lineHeight: 1.45, color: '#e2e8f0', wordBreak: 'break-word' }}>
                  {toast.message}
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  alignSelf: 'flex-start',
                }}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          )
        })}
      </aside>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    return {
      toasts: [],
      notifications: [],
      unreadCount: 0,
      showToast: () => {},
      dismissToast: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      recordLoginNotification: () => {},
      recordChatMessage: () => {},
      recordExperienceShared: () => {},
    }
  }
  return context
}

export default NotificationContext
