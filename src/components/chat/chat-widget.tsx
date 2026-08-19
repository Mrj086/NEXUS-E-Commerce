'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Bot, X, Send, MessageCircle, Minus, Sparkles, Store } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  id: string
  content: string
  isFromAI: boolean
  createdAt: string
  senderName?: string
}

function formatMessage(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    // Bold text
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const formatted = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      }
      return <React.Fragment key={j}>{part}</React.Fragment>
    })

    if (line.startsWith('- ') || line.startsWith('\u2022 ')) {
      return <div key={i} className="flex gap-1.5 ml-1"><span className="text-[#4F8CFF] shrink-0">\u2022</span><span>{formatted.slice(1)}</span></div>
    }
    if (line.trim() === '') return <br key={i} />
    return <div key={i}>{formatted}</div>
  })
}

const PRODUCT_CATALOG_SIZE = 16

const CUSTOMER_SUGGESTIONS = [
  'Find me a laptop',
  'Best deals under $200',
  'Compare headphones',
  'Gift ideas for tech lovers',
  'What should a developer buy?',
  'Top rated products',
]

const SELLER_SUGGESTIONS = [
  'How to boost sales',
  'Pricing strategies',
  'Product photography tips',
  'Customer engagement',
  'Inventory management',
  'Marketing ideas',
]

export function ChatWidget() {
  const { user, chatOpen, setChatOpen } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const socketConnectedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string>(`session_${user?.id}_${Date.now()}`)
  const hasInitializedRef = useRef(false)

  const addAiMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `ai_${Date.now()}`,
      content,
      isFromAI: true,
      createdAt: new Date().toISOString(),
      senderName: 'NEXUS AI',
    }
    setMessages(prev => [...prev, msg])
    setIsTyping(false)
  }, [])

  const sendViaRest = useCallback(async (content: string) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: sessionIdRef.current,
          userId: user?.id,
          role: user?.role,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        addAiMessage(data.reply || data.message || data.content || 'Sorry, I could not process your request.')
      } else {
        addAiMessage('I\'m having trouble reaching the server. Please try again in a moment.')
      }
    } catch {
      addAiMessage('Connection issue detected. Please check your internet connection and try again.')
    }
  }, [user?.id, user?.role, addAiMessage])

  useEffect(() => {
    if (!chatOpen || !user) return

    const socket = io('/?XTransformPort=3004', {
      auth: { userId: user.id, role: user.role },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socketConnectedRef.current = true
      socket.emit('getHistory', { sessionId: sessionIdRef.current })
    })

    socket.on('disconnect', () => {
      socketConnectedRef.current = false
    })

    socket.on('history', (history: ChatMessage[]) => {
      setMessages(history)
    })

    socket.on('receiveMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
      setIsTyping(false)
    })

    socket.on('typing', () => setIsTyping(true))
    socket.on('error', (err) => console.error('Chat error:', err))

    socketRef.current = socket

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        content: user.role === 'CUSTOMER'
          ? `Hi ${user.name}! \ud83d\udc4b I'm NEXUS AI, your personal shopping assistant.\n\nI know everything about our ${PRODUCT_CATALOG_SIZE} products \u2014 from laptops and headphones to books and fitness gear. I can:\n\n\u2022 Find the perfect product for your needs\n\u2022 Compare prices and features\n\u2022 Suggest deals and gift ideas\n\u2022 Answer questions about any product\n\nWhat are you looking for today?`
          : `Hi ${user.name}! \ud83d\udc4b I'm NEXUS AI, your business assistant.\n\nI can help you with:\n\n\u2022 Sales optimization strategies\n\u2022 Product listing improvements\n\u2022 Pricing and inventory tips\n\u2022 Customer engagement ideas\n\nWhat would you like to work on today?`,
        isFromAI: true,
        createdAt: new Date().toISOString(),
        senderName: 'NEXUS AI',
      }
      setMessages([welcomeMsg])
    }

    return () => { socket.disconnect() }
  }, [chatOpen, user])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const msg: ChatMessage = {
      id: `temp_${Date.now()}`,
      content: input.trim(),
      isFromAI: false,
      createdAt: new Date().toISOString(),
      senderName: user?.name,
    }

    setMessages(prev => [...prev, msg])
    setInput('')
    setIsTyping(true)

    const content = input.trim()

    // Try Socket.IO first if connected, fall back to REST API
    if (socketRef.current && socketConnectedRef.current) {
      socketRef.current.emit('sendMessage', {
        content,
        sessionId: sessionIdRef.current,
      })
      // Safety timeout: if no response via socket within 8s, try REST
      setTimeout(() => {
        setIsTyping(prev => {
          if (prev) {
            // Still typing after 8s — socket may have silently failed
            sendViaRest(content)
          }
          return prev
        })
      }, 8000)
    } else {
      sendViaRest(content)
    }
  }

  const handleViewProducts = () => {
    // Dispatch a custom event or navigate to shop tab
    const event = new CustomEvent('navigate-to-shop')
    window.dispatchEvent(event)
  }

  if (!chatOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 pulse-glow"
        style={{
          background: 'linear-gradient(135deg, #4F8CFF, #7AB3FF)',
          boxShadow: '0 8px 32px rgba(79, 140, 255, 0.3)',
        }}
        onClick={() => setChatOpen(true)}
      >
        <MessageCircle className="w-6 h-6 text-[#060D1A]" />
        <motion.span
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'w-80' : 'w-[420px]'} rounded-2xl overflow-hidden`}
        style={{
          background: '#0B1628',
          border: '1px solid rgba(79, 140, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(79, 140, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #0B1628, #111D33)',
            borderBottom: '1px solid rgba(79, 140, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,98,0.2), rgba(201,169,98,0.1))',
                border: '1px solid rgba(79, 140, 255, 0.3)',
              }}
              animate={{ boxShadow: ['0 0 0px rgba(201,169,98,0)', '0 0 15px rgba(201,169,98,0.2)', '0 0 0px rgba(201,169,98,0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-[#4F8CFF]" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm text-white">NEXUS AI</h3>
              <p className="text-xs text-[#4F8CFF] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setChatOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              className="h-80 overflow-y-auto p-4 space-y-3"
              style={{ background: '#060D1A', scrollbarWidth: 'thin' }}
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx === messages.length - 1 ? 0.1 : 0, duration: 0.3 }}
                  className={`flex gap-2.5 ${msg.isFromAI ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.isFromAI
                      ? 'bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF]'
                      : 'bg-[#111D33] border border-white/10'
                  }`}>
                    {msg.isFromAI
                      ? <Bot className="w-3.5 h-3.5 text-[#060D1A]" />
                      : <span className="text-xs font-bold text-white">{msg.senderName?.charAt(0)}</span>
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.isFromAI
                      ? 'bg-[#0B1628] text-gray-300 rounded-tl-sm border border-white/5'
                      : 'text-white rounded-tr-sm'
                  }`}
                  style={msg.isFromAI ? {} : {
                    background: 'linear-gradient(135deg, #4F8CFF, #b8974a)',
                  }}>
                    {msg.isFromAI ? formatMessage(msg.content) : msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-[#060D1A]" />
                  </div>
                  <div className="bg-[#0B1628] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                    <div className="flex gap-1.5">
                      {[0, 0.1, 0.2].map((delay) => (
                        <motion.div
                          key={delay}
                          className="w-2 h-2 bg-[#4F8CFF] rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2.5" style={{ background: '#0B1628', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Quick suggestions:</p>
                  <button
                    onClick={handleViewProducts}
                    className="flex items-center gap-1 text-xs text-[#4F8CFF] hover:text-[#7AB3FF] transition-colors"
                  >
                    <Store className="w-3 h-3" />
                    View Products
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(user?.role === 'CUSTOMER'
                    ? CUSTOMER_SUGGESTIONS
                    : SELLER_SUGGESTIONS
                  ).map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setInput(suggestion)}
                      className="text-xs px-2.5 py-1 rounded-full transition-colors"
                      style={{
                        background: 'rgba(79, 140, 255, 0.1)',
                        color: '#4F8CFF',
                        border: '1px solid rgba(79, 140, 255, 0.2)',
                      }}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="p-3 flex gap-2"
              style={{ background: '#0B1628', borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-sm bg-[#0B1628] border-white/10 text-white placeholder:text-gray-500 focus:border-[#4F8CFF]/50 focus:ring-[#4F8CFF]/20"
                disabled={isTyping}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!input.trim() || isTyping}
                  style={{
                    background: input.trim() ? 'linear-gradient(135deg, #4F8CFF, #7AB3FF)' : '#111D33',
                  }}
                >
                  <Send className="w-4 h-4 text-[#060D1A]" />
                </Button>
              </motion.div>
            </form>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}