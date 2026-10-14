import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { chatApi } from '../api/chatApi'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../hooks/useNotification'

export function Chat() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useNotification()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarTab, setSidebarTab] = useState('active')

  // Responsive mobile detector
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  // Initial load: Fetch conversations and available authors
  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true
    const initData = async () => {
      try {
        setLoading(true)
        const [convsRes, usersRes] = await Promise.allSettled([
          chatApi.getConversations(),
          chatApi.getAvailableUsers(),
        ])

        const convs = convsRes.status === 'fulfilled' ? (convsRes.value?.data?.data || convsRes.value?.data || []) : []
        const users = usersRes.status === 'fulfilled' ? (usersRes.value?.data?.data || usersRes.value?.data || []) : []

        if (!isMounted) return
        setConversations(Array.isArray(convs) ? convs : [])
        setAvailableUsers(Array.isArray(users) ? users : [])

        // If URL has target user params (?userId=123&userName=Jane)
        const targetUserId = searchParams.get('userId')
        const targetUserName = searchParams.get('userName')

        if (targetUserId) {
          const numericId = Number(targetUserId)
          const matchedUser = users.find((u) => u.id === numericId)
          const matchedConv = convs.find((c) => c.contactId === numericId)

          setActiveContact({
            id: numericId,
            name: targetUserName || matchedUser?.name || matchedConv?.contactName || 'Peer Candidate',
            hasSharedExperience: matchedUser?.hasSharedExperience || false,
            role: matchedUser?.role || '',
            email: matchedUser?.email || matchedConv?.contactEmail || '',
          })
        } else if (!isMobile && convs.length > 0) {
          // On desktop, auto-select latest conversation
          setActiveContact({
            id: convs[0].contactId,
            name: convs[0].contactName,
            email: convs[0].contactEmail,
          })
        }
      } catch (err) {
        console.error('[Chat] Failed to initialize chat:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initData()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, searchParams, isMobile])

  // Fetch message history whenever activeContact changes
  const fetchHistory = async (contactId, silent = false) => {
    if (!contactId) return
    if (!silent) setLoadingHistory(true)
    try {
      const res = await chatApi.getConversationHistory(contactId)
      const list = res?.data?.data || res?.data || []
      setMessages(Array.isArray(list) ? list : [])
      if (!silent) {
        setTimeout(() => scrollToBottom(false), 50)
      }
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err)
    } finally {
      if (!silent) setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeContact?.id) {
      fetchHistory(activeContact.id)

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = setInterval(() => {
        fetchHistory(activeContact.id, true)
      }, 3500)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [activeContact])

  const handleSelectContact = (contact) => {
    setActiveContact(contact)
    setConversations((prev) =>
      prev.map((c) => (c.contactId === contact.id ? { ...c, unreadCount: 0 } : c))
    )
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim() || !activeContact?.id || isSending) return

    const content = newMessage.trim()
    setIsSending(true)

    try {
      const res = await chatApi.sendMessage(activeContact.id, content)
      const savedMsg = res?.data?.data || res?.data

      if (savedMsg && savedMsg.id) {
        setMessages((prev) => [...prev, savedMsg])
      } else {
        // Optimistic append
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            senderId: user?.id,
            senderName: user?.name,
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
          },
        ])
      }

      setNewMessage('')
      setTimeout(() => scrollToBottom(true), 50)

      // Refresh conversations list in background
      chatApi.getConversations().then((cRes) => {
        const cList = cRes?.data?.data || cRes?.data || []
        if (Array.isArray(cList)) setConversations(cList)
      }).catch(() => {})
    } catch (err) {
      console.error('[Chat] Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Pre-configured peer discussion starters
  const quickStarters = [
    'Hi! How was the difficulty of your coding round?',
    'Could you share what questions came in the system design round?',
    'Any specific tips you would recommend for this company?',
    'Did they ask any questions from your resume projects?',
  ]

  // Filter contacts
  const filteredActiveConversations = conversations.filter(
    (c) =>
      c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isCurrentUser = (u) => {
    if (!u) return true
    if (user?.id && (u.id === user.id || String(u.id) === String(user.id))) return true
    if (user?.email && u.email && u.email.toLowerCase() === user.email.toLowerCase()) return true
    if (user?.name && u.name && u.name.trim().toLowerCase() === user.name.trim().toLowerCase()) return true
    return false
  }

  const filteredNewUsers = availableUsers.filter((u) => {
    // CRITICAL: Current logged-in user must NEVER appear in new users list
    if (isCurrentUser(u)) return false

    const matchesSearch =
      (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())

    const alreadyInActive = conversations.some((c) => c.contactId === u.id)

    return matchesSearch && !alreadyInActive
  })

  const formatMessageTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="container" style={{ padding: isMobile ? '1rem 0.5rem' : '2rem 1rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Live Peer Chat
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'var(--text-secondary)' }}>
            Connect directly with verified interview authors and candidates. Messages are private and securely saved.
          </p>
        </div>

        {isMobile && activeContact && (
          <button
            type="button"
            onClick={() => setActiveContact(null)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            ← View All Contacts
          </button>
        )}
      </div>

      {/* Main Chat Container */}
      <div
        style={{
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          minHeight: isMobile ? '500px' : '620px',
          height: isMobile ? 'calc(100vh - 180px)' : '75vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl, 16px)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
        id="chat-main-window"
      >
        {/* Left Column: Contacts & Active Threads (Shown if !isMobile or !activeContact on mobile) */}
        {(!isMobile || !activeContact) && (
          <div
            style={{
              borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
            id="chat-contacts-sidebar"
          >
            {/* Tabs: Active Chats vs New Chat (Authors) */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setSidebarTab('active')}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: sidebarTab === 'active' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: sidebarTab === 'active' ? '#818cf8' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
                id="chat-tab-active-chats"
              >
                <span>Active Chats</span>
                {conversations.length > 0 && (
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe' }}>
                    {conversations.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('new')}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: sidebarTab === 'new' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: sidebarTab === 'new' ? '#818cf8' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
                id="chat-tab-new-chat"
              >
                <span>+ New Users</span>
                {filteredNewUsers.length > 0 && (
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                    {filteredNewUsers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Contact Search */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                placeholder={sidebarTab === 'active' ? 'Search conversations...' : 'Search new users...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--bg-card)',
                }}
              />
            </div>

            {/* Contacts List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.4rem 0.5rem 0.25rem' }}>
                {sidebarTab === 'active' ? 'Direct Discussions' : 'New Users (Connect Directly)'}
              </div>

              {loading ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading contacts...
                </div>
              ) : sidebarTab === 'active' ? (
                // TAB 1: Only users with whom you have chatted
                filteredActiveConversations.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>💬</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      No Active Chats Yet
                    </div>
                    <p style={{ fontSize: '0.785rem', margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
                      Your discussions are private and visible only to you and the candidate you chat with.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSidebarTab('new')}
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        cursor: 'pointer',
                      }}
                    >
                      Connect with New Users
                    </button>
                  </div>
                ) : (
                  filteredActiveConversations.map((conv) => {
                    const isActive = activeContact?.id === conv.contactId
                    return (
                      <button
                        key={conv.contactId}
                        type="button"
                        onClick={() => handleSelectContact({ id: conv.contactId, name: conv.contactName, email: conv.contactEmail })}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: isActive ? '#ffffff' : 'var(--text-primary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          marginBottom: '0.35rem',
                        }}
                        className="chat-contact-item"
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isActive
                              ? 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {conv.contactName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conv.contactName}
                            </span>
                            <span style={{ fontSize: '0.685rem', color: 'var(--text-muted)' }}>
                              {formatMessageTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          {conv.contactEmail && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary, #818cf8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                              {conv.contactEmail}
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            {conv.lastMessage}
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              borderRadius: '10px',
                              padding: '1px 6px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })
                )
              ) : (
                // TAB 2: NEW USERS (Connect directly, excluding logged-in user)
                filteredNewUsers.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      All Users Connected
                    </div>
                    <p style={{ margin: 0, fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                      All registered candidates and contributors are already in your active chat list.
                    </p>
                  </div>
                ) : (
                  filteredNewUsers.map((u) => {
                    const isActive = activeContact?.id === u.id
                    const isContributor = u.hasSharedExperience || u.role === 'EXPERIENCE_CONTRIBUTOR'
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectContact(u)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: isActive ? '#ffffff' : 'var(--text-primary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          marginBottom: '0.35rem',
                        }}
                        className="chat-contact-item"
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isContributor
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: isContributor ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                color: isContributor ? '#10b981' : '#818cf8',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {isContributor ? 'Shared Experience' : 'New User'}
                            </span>
                          </div>
                          {u.email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary, #818cf8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500 }}>
                              {u.email}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            {isContributor ? 'Interview Experience Contributor' : 'Candidate Peer'}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>
                          Chat →
                        </span>
                      </button>
                    )
                  })
                )
              )}
            </div>
          </div>
        )}

        {/* Right Column: Chat Window (Shown if !isMobile or activeContact on mobile) */}
        {(!isMobile || activeContact) && (
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', height: '100%' }}>
            {activeContact ? (
              <>
                {/* Chat Window Header */}
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-card)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => setActiveContact(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#818cf8',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          padding: '0 0.5rem 0 0',
                          fontWeight: 700,
                        }}
                        title="Back to Contacts"
                      >
                        ←
                      </button>
                    )}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-primary) 0%, #38bdf8 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {activeContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span>{activeContact.name}</span>
                        {activeContact.email && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary, #818cf8)', fontWeight: 500 }}>
                            ({activeContact.email})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <span>{activeContact.hasSharedExperience || activeContact.role === 'EXPERIENCE_CONTRIBUTOR' ? 'Experience Contributor & Peer' : 'Candidate Peer'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Badge */}
                  <div
                    style={{
                      fontSize: '0.725rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    title="Messages are visible only between the two participants"
                  >
                    <span>🔒</span>
                    <span>Direct Private Chat</span>
                  </div>
                </div>

                {/* Message Thread History */}
                <div
                  style={{
                    flex: 1,
                    padding: '1.25rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                  id="chat-messages-container"
                >
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Loading message history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        Chat directly with {activeContact.name}
                      </div>
                      <p style={{ fontSize: '0.825rem', maxWidth: '380px', margin: '0 auto 1rem', color: 'var(--text-secondary)' }}>
                        Ask questions about their interview experience, hiring rounds, questions asked, or preparation guidance.
                      </p>

                      {/* Quick Starters */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '420px', margin: '0 auto' }}>
                        {quickStarters.map((qs, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewMessage(qs)
                            }}
                            style={{
                              padding: '0.5rem 0.85rem',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              borderRadius: 'var(--radius-md, 8px)',
                              border: '1px solid var(--border-medium)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            "{qs}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSelf = m.senderId === user?.id
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            justifyContent: isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              maxWidth: isMobile ? '85%' : '70%',
                              padding: '0.65rem 0.95rem',
                              borderRadius: isSelf ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                              backgroundColor: isSelf ? 'var(--brand-primary)' : 'var(--bg-card)',
                              color: isSelf ? '#ffffff' : 'var(--text-primary)',
                              boxShadow: 'var(--shadow-sm)',
                              border: isSelf ? 'none' : '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                              {m.content}
                            </div>
                            <div
                              style={{
                                fontSize: '0.675rem',
                                color: isSelf ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)',
                                marginTop: '0.25rem',
                                textAlign: 'right',
                              }}
                            >
                              {formatMessageTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Message ${activeContact.name}... (Press Enter to send)`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    className="form-control"
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.9rem',
                      fontSize: '0.875rem',
                    }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="btn btn-primary"
                    style={{
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Select an Experience Author
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '360px', textAlign: 'center', margin: 0 }}>
                  Choose an interview author from the sidebar to chat directly and ask real interview questions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
