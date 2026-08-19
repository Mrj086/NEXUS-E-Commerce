'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { AuthPage } from '@/components/auth/auth-page'
import { AdminPanel } from '@/components/admin/admin-panel'
import { CustomerPanel } from '@/components/customer/customer-panel'
import { SellerPanel } from '@/components/seller/seller-panel'
import { ChatWidget } from '@/components/chat/chat-widget'
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function HomePage() {
  const user = useAppStore((s) => s.user)
  const currentPanel = useAppStore((s) => s.currentPanel)
  const hydrated = useAppStore((s) => s._hydrated)

  useEffect(() => {
    useAppStore.setState({ _hydrated: true })
    const stored = localStorage.getItem('ecommerce_user')
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        useAppStore.getState().setUser(userData)
        useAppStore.getState().setCurrentPanel(
          userData.role?.toLowerCase() as 'admin' | 'customer' | 'seller'
        )
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem('ecommerce_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ecommerce_user')
    }
  }, [user])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060D1A]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-2 border-[#4F8CFF]/30 flex items-center justify-center">
              <span className="text-3xl font-bold text-gradient-blue">N</span>
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[#4F8CFF]"
              animate={{ opacity: [0, 0.5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  if (!user || currentPanel === 'login' || currentPanel === 'register') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <AuthPage />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPanel}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-[#060D1A]"
      >
        {user?.role === 'ADMIN' && <AdminPanel />}
        {user?.role === 'CUSTOMER' && <CustomerPanel />}
        {user?.role === 'SELLER' && <SellerPanel />}
        {(user?.role === 'CUSTOMER' || user?.role === 'SELLER') && <ChatWidget />}
      </motion.div>
    </AnimatePresence>
  )
}
