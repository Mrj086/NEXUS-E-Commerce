'use client'

import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain,
  Shield,
  MessageSquare,
  ShoppingBag,
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Sparkles,
  Crown,
  Gem,
  Check,
  ChevronDown,
  MapPin,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const
const STAGGER = 0.08
const DURATION = 0.6

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER, delayChildren: 0.1 },
  },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION, ease: EASE_PREMIUM },
  },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION, ease: EASE_PREMIUM },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION, ease: EASE_PREMIUM },
  },
}

const panelVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_PREMIUM },
  },
}

const leftPanelVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_PREMIUM },
  },
}

/* ------------------------------------------------------------------ */
/*  Floating particles for the hero background                        */
/* ------------------------------------------------------------------ */
function HeroParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 8 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.05,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#4F8CFF]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Trust avatars at the bottom of hero                               */
/* ------------------------------------------------------------------ */
function TrustAvatars() {
  const names = ['A', 'M', 'S', 'K', 'J']
  const colors = ['#4F8CFF', '#7AB3FF', '#111D33', '#182844', '#00D4AA']
  return (
    <motion.div className="flex items-center gap-3" variants={fadeSlideUp}>
      <div className="flex -space-x-2">
        {names.map((name, i) => (
          <motion.div
            key={i}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#060D1A]"
            style={{ background: colors[i], color: i >= 2 ? '#7AB3FF' : '#060D1A' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 + i * 0.08, duration: 0.4, ease: EASE_PREMIUM }}
          >
            {name}
          </motion.div>
        ))}
      </div>
      <p className="text-sm text-white/60">
        Trusted by <span className="text-[#7AB3FF] font-semibold">50,000+</span> shoppers worldwide
      </p>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Left hero panel                                                    */
/* ------------------------------------------------------------------ */
function HeroPanel() {
  const features = [
    {
      icon: Brain,
      title: 'AI Recommendations',
      desc: 'Personalized product discovery powered by machine learning',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      desc: 'Enterprise-grade encryption for every transaction',
    },
    {
      icon: MessageSquare,
      title: 'Smart Chatbot',
      desc: '24/7 AI-powered shopping assistant at your service',
    },
  ]

  return (
    <motion.div
      className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #060D1A 0%, #0B1628 50%, #060D1A 100%)',
      }}
      variants={leftPanelVariants}
      initial="hidden"
      animate="visible"
    >
      <HeroParticles />

      {/* Decorative gradient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#4F8CFF]/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#111D33]/30 blur-[120px] pointer-events-none" />

      <motion.div className="relative z-10" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="flex items-center gap-3 mb-1" variants={fadeSlideUp}>
          <motion.div
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] flex items-center justify-center"
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
          >
            <Gem className="w-5 h-5 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-blue">NEXUS</h1>
        </motion.div>
        <motion.p className="text-white/50 text-sm ml-14 tracking-wide" variants={fadeSlideUp}>
          Curated Commerce, Powered by AI
        </motion.p>
      </motion.div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col justify-center py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-10"
          variants={fadeSlideUp}
        >
          The Future of
          <br />
          <span className="text-gradient-blue">Smart Commerce</span>
        </motion.h2>

        <div className="space-y-7">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-4 group"
              variants={fadeSlideUp}
              whileHover={{ x: 6 }}
              transition={{ duration: 0.3, ease: EASE_PREMIUM }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4F8CFF]/20 transition-colors duration-300">
                <feat.icon className="w-5 h-5 text-[#4F8CFF]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-1">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <TrustAvatars />
        <motion.p className="text-white/20 text-xs mt-4" variants={fadeIn}>
          &copy; {new Date().getFullYear()} NEXUS. All rights reserved.
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Blue submit button                                                 */
/* ------------------------------------------------------------------ */
function BlueButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      className="relative w-full h-12 rounded-xl font-semibold text-sm overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #4F8CFF, #7AB3FF)',
        color: '#FFFFFF',
      }}
      whileHover={{ scale: 1.015, boxShadow: '0 0 30px rgba(79,140,255,0.25), 0 0 60px rgba(79,140,255,0.1)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: EASE_PREMIUM }}
      {...(props as any)}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {children}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </span>
      <motion.div
        className="absolute inset-0 bg-white/0 group-hover:bg-white/10"
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/*  Styled input field                                                 */
/* ------------------------------------------------------------------ */
function FormInput({
  icon: Icon,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType; label: string }) {
  return (
    <motion.div className="space-y-2" variants={fadeSlideUp}>
      <Label htmlFor={props.id} className="text-white/60 text-xs font-medium tracking-wide uppercase">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        )}
        <Input
          id={props.id}
          className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-4 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300"
          {...props}
        />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Role Selector Tabs (3 clickable sections)                           */
/* ------------------------------------------------------------------ */
function RoleSelectorTabs({
  selected,
  onChange,
}: {
  selected: 'admin' | 'customer' | 'seller'
  onChange: (role: 'admin' | 'customer' | 'seller') => void
}) {
  const roles = [
    { key: 'admin' as const, icon: Crown, label: 'Admin', desc: 'Platform Management' },
    { key: 'customer' as const, icon: ShoppingBag, label: 'Customer', desc: 'Shop & Discover' },
    { key: 'seller' as const, icon: Store, label: 'Seller', desc: 'Sell & Manage' },
  ]

  return (
    <motion.div className="space-y-3 mb-8" variants={scaleIn}>
      <p className="text-xs text-white/40 text-center tracking-wide uppercase font-medium">
        Select your role
      </p>
      <div className="grid grid-cols-3 gap-2">
        {roles.map((role, i) => {
          const isActive = selected === role.key
          return (
            <motion.button
              key={role.key}
              type="button"
              onClick={() => onChange(role.key)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'border-[#4F8CFF] bg-[#4F8CFF]/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#4F8CFF]/5 to-transparent pointer-events-none"
                  layoutId="role-tab-glow"
                  transition={{ duration: 0.4, ease: EASE_PREMIUM }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    isActive
                      ? 'bg-[#4F8CFF]/20 border border-[#4F8CFF]/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <role.icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? 'text-[#4F8CFF]' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-center">
                  <span
                    className={`text-xs font-semibold block transition-colors duration-300 ${
                      isActive ? 'text-[#7AB3FF]' : 'text-white/50'
                    }`}
                  >
                    {role.label}
                  </span>
                  <span className={`text-[10px] block transition-colors duration-300 ${isActive ? 'text-white/40' : 'text-white/25'}`}>
                    {role.desc}
                  </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Login form section (reusable across roles)                         */
/* ------------------------------------------------------------------ */
function LoginFormSection({ role }: { role: 'admin' | 'customer' | 'seller' }) {
  const { setUser, setCurrentPanel } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: role.toUpperCase() }),
      })
      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setCurrentPanel(data.user.role.toLowerCase() as 'admin' | 'customer' | 'seller')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <motion.div variants={fadeSlideUp}>
        <h2 className="text-2xl font-bold text-white mb-1">Welcome back{role === 'admin' ? ', Admin' : role === 'seller' ? ', Seller' : ''}</h2>
        <p className="text-white/40 text-sm">Sign in to your {role === 'admin' ? 'admin dashboard' : role === 'seller' ? 'seller dashboard' : 'NEXUS account'}</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <FormInput
        id="login-email"
        type="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <motion.div className="space-y-2" variants={fadeSlideUp}>
        <Label htmlFor="login-password" className="text-white/60 text-xs font-medium tracking-wide uppercase">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-11 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300"
          />
          <motion.button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center justify-between"
        variants={fadeSlideUp}
      >
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
            className="border-white/20 data-[state=checked]:bg-[#4F8CFF] data-[state=checked]:border-[#4F8CFF] data-[state=checked]:text-white"
          />
          <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
            Remember me
          </span>
        </label>
        <motion.button
          type="button"
          className="text-[#4F8CFF] text-sm font-medium hover:text-[#7AB3FF] transition-colors"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          Forgot password?
        </motion.button>
      </motion.div>

      <motion.div variants={fadeSlideUp}>
        <BlueButton loading={loading}>Sign In</BlueButton>
      </motion.div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Customer Register Form                                             */
/* ------------------------------------------------------------------ */
function CustomerRegisterForm() {
  const { setUser, setCurrentPanel } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [age, setAge] = useState('')
  const [profession, setProfession] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name, email, password, role: 'CUSTOMER' }
      if (age) body.age = parseInt(age)
      if (profession) body.profession = profession

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setCurrentPanel(data.user.role.toLowerCase() as 'admin' | 'customer' | 'seller')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const professions = [
    'Student', 'Software Engineer', 'Designer', 'Doctor', 'Teacher',
    'Business Owner', 'Freelancer', 'Marketing', 'Healthcare', 'Other',
  ]

  return (
    <motion.form
      onSubmit={handleRegister}
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeSlideUp}>
        <h3 className="text-lg font-bold text-white mb-0.5">Register as a new Customer</h3>
        <p className="text-white/40 text-xs">Join NEXUS and start discovering curated products</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <FormInput
        id="cust-reg-name"
        label="Full Name"
        icon={User}
        placeholder="John Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <FormInput
        id="cust-reg-email"
        type="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <motion.div className="space-y-2" variants={fadeSlideUp}>
        <Label htmlFor="cust-reg-password" className="text-white/60 text-xs font-medium tracking-wide uppercase">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <Input
            id="cust-reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-11 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300"
          />
          <motion.button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        key="customer-optional-fields"
        className="grid grid-cols-2 gap-3"
        variants={fadeSlideUp}
      >
        <motion.div className="space-y-2" variants={fadeSlideUp}>
          <Label htmlFor="cust-reg-age" className="text-white/60 text-xs font-medium tracking-wide uppercase">
            Age <span className="text-white/20 normal-case">(optional)</span>
          </Label>
          <Input
            id="cust-reg-age"
            type="number"
            placeholder="25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={13}
            max={100}
            className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl px-4 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </motion.div>
        <motion.div className="space-y-2" variants={fadeSlideUp}>
          <Label className="text-white/60 text-xs font-medium tracking-wide uppercase">
            Profession <span className="text-white/20 normal-case">(optional)</span>
          </Label>
          <Select value={profession} onValueChange={setProfession}>
            <SelectTrigger className="h-11 bg-[#0B1628] border-white/10 text-white/70 rounded-xl text-sm focus:ring-[#4F8CFF]/30 focus:border-[#4F8CFF]/50 transition-all duration-300">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-[#111D33] border-white/10 rounded-xl">
              {professions.map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  className="text-white/80 focus:bg-[#182844] focus:text-white rounded-lg"
                >
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeSlideUp}>
        <BlueButton loading={loading}>Create Account</BlueButton>
      </motion.div>

      <motion.div
        className="flex items-center gap-2 justify-center"
        variants={fadeSlideUp}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#4F8CFF]" />
        <span className="text-xs text-white/30">AI-powered recommendations from day one</span>
      </motion.div>
    </motion.form>
  )
}

/* ------------------------------------------------------------------ */
/*  Seller Register Form                                               */
/* ------------------------------------------------------------------ */
function SellerRegisterForm() {
  const { setUser, setCurrentPanel } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name, email, password, role: 'SELLER' }
      if (phone) body.phone = phone
      if (address) body.address = address

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setCurrentPanel(data.user.role.toLowerCase() as 'admin' | 'customer' | 'seller')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleRegister}
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeSlideUp}>
        <h3 className="text-lg font-bold text-white mb-0.5">Register as a new Seller</h3>
        <p className="text-white/40 text-xs">List & manage your products on NEXUS</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <FormInput
        id="seller-reg-name"
        label="Full Name"
        icon={User}
        placeholder="Jane Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <FormInput
        id="seller-reg-email"
        type="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <motion.div className="space-y-2" variants={fadeSlideUp}>
        <Label htmlFor="seller-reg-password" className="text-white/60 text-xs font-medium tracking-wide uppercase">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <Input
            id="seller-reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-11 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300"
          />
          <motion.button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      <FormInput
        id="seller-reg-phone"
        label="Phone"
        icon={Check}
        placeholder="+1 (555) 000-0000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <motion.div className="space-y-2" variants={fadeSlideUp}>
        <Label htmlFor="seller-reg-address" className="text-white/60 text-xs font-medium tracking-wide uppercase">
          Address <span className="text-white/20 normal-case">(optional)</span>
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <Input
            id="seller-reg-address"
            placeholder="123 Commerce St, City, State"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-11 bg-[#0B1628] border-white/10 text-white placeholder:text-white/20 rounded-xl pl-11 pr-4 text-sm focus-visible:ring-[#4F8CFF]/30 focus-visible:border-[#4F8CFF]/50 transition-all duration-300"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeSlideUp}>
        <BlueButton loading={loading}>Create Account</BlueButton>
      </motion.div>

      <motion.div
        className="flex items-center gap-2 justify-center"
        variants={fadeSlideUp}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#00D4AA]" />
        <span className="text-xs text-white/30">Start selling to millions of shoppers</span>
      </motion.div>
    </motion.form>
  )
}

/* ------------------------------------------------------------------ */
/*  Divider between login and register sections                        */
/* ------------------------------------------------------------------ */
function RegisterDivider({ onToggleRegister, showRegister }: { onToggleRegister: () => void; showRegister: boolean }) {
  return (
    <motion.div
      className="relative flex items-center gap-4 my-6"
      variants={fadeSlideUp}
    >
      <Separator className="flex-1 bg-white/10" />
      <motion.button
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-xl glass cursor-pointer hover:bg-white/[0.06] transition-colors duration-300"
        onClick={onToggleRegister}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE_PREMIUM }}
      >
        <span className="text-xs text-white/40 whitespace-nowrap">
          {showRegister ? 'Already have an account?' : 'New to NEXUS?'}
        </span>
        <span className="text-xs font-semibold text-[#4F8CFF] whitespace-nowrap">
          {showRegister ? 'Sign In' : 'Register'}
        </span>
      </motion.button>
      <Separator className="flex-1 bg-white/10" />
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main AuthPage export                                              */
/* ------------------------------------------------------------------ */
export function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer' | 'seller'>('customer')
  const [showRegister, setShowRegister] = useState(false)

  const handleRoleChange = (role: 'admin' | 'customer' | 'seller') => {
    setSelectedRole(role)
    setShowRegister(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#060D1A]">
      {/* Left Panel - Hero */}
      <HeroPanel />

      {/* Right Panel - Auth Forms */}
      <motion.div
        className="w-full lg:w-1/2 min-h-[60vh] lg:min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#0B1628]"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-[420px]">
          {/* Mobile brand (visible only on small screens) */}
          <motion.div
            className="flex items-center gap-3 mb-8 lg:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_PREMIUM }}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] flex items-center justify-center">
              <Gem className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gradient-blue">NEXUS</h1>
          </motion.div>

          {/* Role Selector Tabs */}
          <RoleSelectorTabs selected={selectedRole} onChange={handleRoleChange} />

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedRole}-${showRegister}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-0"
            >
              {/* Admin: login only, no register option */}
              {selectedRole === 'admin' && (
                <>
                  <LoginFormSection role={selectedRole} />
                </>
              )}

              {/* Customer: login + optional register */}
              {selectedRole === 'customer' && !showRegister && (
                <>
                  <LoginFormSection role={selectedRole} />
                  <RegisterDivider
                    onToggleRegister={() => setShowRegister(true)}
                    showRegister={false}
                  />
                  <motion.p className="text-center text-xs text-white/25" variants={fadeSlideUp}>
                    Select <span className="text-[#4F8CFF] font-medium">Register</span> to create a new customer account
                  </motion.p>
                </>
              )}

              {/* Customer: register form */}
              {selectedRole === 'customer' && showRegister && (
                <>
                  <RegisterDivider
                    onToggleRegister={() => setShowRegister(false)}
                    showRegister={true}
                  />
                  <CustomerRegisterForm />
                </>
              )}

              {/* Seller: login + optional register */}
              {selectedRole === 'seller' && !showRegister && (
                <>
                  <LoginFormSection role={selectedRole} />
                  <RegisterDivider
                    onToggleRegister={() => setShowRegister(true)}
                    showRegister={false}
                  />
                  <motion.p className="text-center text-xs text-white/25" variants={fadeSlideUp}>
                    Select <span className="text-[#4F8CFF] font-medium">Register</span> to create a new seller account
                  </motion.p>
                </>
              )}

              {/* Seller: register form */}
              {selectedRole === 'seller' && showRegister && (
                <>
                  <RegisterDivider
                    onToggleRegister={() => setShowRegister(false)}
                    showRegister={true}
                  />
                  <SellerRegisterForm />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
