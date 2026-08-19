'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ShoppingCart, User, LogOut, ChevronRight, ChevronLeft, Star,
  Plus, Minus, X, Heart, Eye, Truck, Package, Clock, CheckCircle2,
  Banknote, CreditCard, Smartphone, Lock, Shield, Check, ArrowRight,
  ShoppingBag, TrendingUp, Filter, Grid3X3, List, MapPin, Phone, Mail,
  Tag, Sparkles, AlertCircle, Loader2, ChevronDown, ArrowLeft, CircleDot,
  Camera, Upload, ImageIcon, ScanSearch, Zap, RefreshCw, FileText,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { InvoiceView } from '@/components/invoice/invoice-view'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPrice?: number | null
  category: string
  subcategory?: string | null
  tags: string
  stockQuantity: number
  imageUrl?: string | null
  rating: number
  reviewCount: number
  isFeatured: boolean
  seller: { id: string; name: string; avatar?: string | null }
  recommendationScore?: number
  recommendationReason?: string
}

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  shippingAddress: string
  paymentMethod?: string | null
  createdAt: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productName: string
  productPrice: number
  quantity: number
  product?: { id: string; name: string; imageUrl?: string | null }
}

interface BrowsingHistoryItem {
  id: string
  product: Product
  viewCount: number
  lastViewedAt: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Books', 'Toys']

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '💻',
  Fashion: '👔',
  'Home & Living': '🏠',
  Sports: '⚽',
  Beauty: '💄',
  Books: '📚',
  Toys: '🧸',
}

const MOBILE_BANK_PROVIDERS = [
  { id: 'bkash', name: 'bKash', color: '#E2136E' },
  { id: 'nagad', name: 'Nagad', color: '#F6921E' },
  { id: 'rocket', name: 'Rocket', color: '#8C3494' },
  { id: 'upay', name: 'Upay', color: '#1A3C6D' },
]

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode; step: number }> = {
  PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Order Placed', icon: <Clock className="w-3.5 h-3.5" />, step: 1 },
  CONFIRMED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Confirmed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, step: 2 },
  SHIPPED: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Shipped', icon: <Truck className="w-3.5 h-3.5" />, step: 3 },
  DELIVERED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Delivered', icon: <Package className="w-3.5 h-3.5" />, step: 4 },
  CANCELLED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled', icon: <X className="w-3.5 h-3.5" />, step: 0 },
}

const TRACKING_STEPS = [
  { label: 'Order Placed', icon: <Clock className="w-3.5 h-3.5" /> },
  { label: 'Confirmed', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { label: 'Shipped', icon: <Truck className="w-3.5 h-3.5" /> },
  { label: 'Delivered', icon: <Package className="w-3.5 h-3.5" /> },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function detectCardBrand(number: string): 'visa' | 'mastercard' | 'amex' | null {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return null
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

// ─── Star Rating Component ───────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${i <= Math.round(rating) ? 'fill-[#4F8CFF] text-[#4F8CFF]' : 'text-white/20'}`}
        />
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CustomerPanel() {
  const user = useAppStore((s) => s.user)
  const { cartItems, cartCount, addToCart, removeFromCart, updateCartQuantity, clearCart, logout, setCurrentPanel } = useAppStore()

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [activeTab, setActiveTab] = useState('shop')

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistoryItem[]>([])

  // Loading
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailQty, setDetailQty] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)

  // Checkout
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [placingOrder, setPlacingOrder] = useState(false)

  // Shipping
  const [shippingForm, setShippingForm] = useState({
    fullName: '', phone: '', address: '', city: '', postalCode: '',
  })
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({})

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD' | 'MOBILE_BANKING'>('COD')
  const [cardForm, setCardForm] = useState({
    number: '', expiry: '', cvv: '', name: '',
  })
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const [mobileBankProvider, setMobileBankProvider] = useState('bkash')
  const [mobileBankPhone, setMobileBankPhone] = useState('')
  const [mobileBankErrors, setMobileBankErrors] = useState<Record<string, string>>({})

  // Order success
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState('')

  // Cart toast notification
  const [cartToast, setCartToast] = useState<{ show: boolean; name: string }>({ show: false, name: '' })

  // AI Image Search state
  const [imageSearchOpen, setImageSearchOpen] = useState(false)
  const [imageSearchLoading, setImageSearchLoading] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<(Product & { matchScore?: number; matchReason?: string })[]>([])
  const [imageSearchAnalysis, setImageSearchAnalysis] = useState('')
  const [imageSearchTags, setImageSearchTags] = useState<string[]>([])
  const [imageSearchCategory, setImageSearchCategory] = useState('')
  const [imageSearchStyle, setImageSearchStyle] = useState('')
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const recScrollRef = useRef<HTMLDivElement>(null)

  // ── Derived ──
  const cartSubtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0),
    [cartItems]
  )
  const shipping = cartSubtotal > 100 ? 0 : 9.99
  const cartTotal = cartSubtotal + shipping

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.toLowerCase().includes(q)
      )
    }
    switch (sortBy) {
      case 'price-asc': list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)); break
      case 'price-desc': list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)); break
      case 'rating': list.sort((a, b) => b.rating - a.rating); break
      default: list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }
    return list
  }, [products, selectedCategory, searchQuery, sortBy])

  // ── Data Fetching ──

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (searchQuery.trim()) params.set('search', searchQuery)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.products) setProducts(data.products)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }, [selectedCategory, searchQuery])

  const fetchRecommendations = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoadingRecommendations(true)
      const res = await fetch(`/api/ai/recommendations?customerId=${user.id}`)
      const data = await res.json()
      if (data.recommendations) setRecommendations(data.recommendations)
    } catch (err) {
      console.error('Failed to fetch AI recommendations:', err)
    } finally {
      setLoadingRecommendations(false)
    }
  }, [user?.id])

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoadingOrders(true)
      const res = await fetch(`/api/orders?customerId=${user.id}`)
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }, [user?.id])

  const fetchBrowsingHistory = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoadingHistory(true)
      const res = await fetch(`/api/recommendations?customerId=${user.id}`)
      const data = await res.json()
      if (data.recommendations) {
        setBrowsingHistory(
          data.recommendations.slice(0, 8).map((r: Product) => ({
            id: r.id,
            product: r,
            viewCount: Math.floor(Math.random() * 5) + 1,
            lastViewedAt: new Date().toISOString(),
          }))
        )
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [user?.id])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { fetchRecommendations() }, [fetchRecommendations])
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
    if (activeTab === 'history') fetchBrowsingHistory()
  }, [activeTab, fetchOrders, fetchBrowsingHistory])

  // ── Handlers ──

  const handleAddToCart = (product: Product, qty = 1) => {
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productPrice: product.discountPrice ?? product.price,
      productImage: product.imageUrl ?? undefined,
      quantity: qty,
    })
    setCartToast({ show: true, name: product.name })
    setTimeout(() => setCartToast({ show: false, name: '' }), 2500)
  }

  const handleQuickView = async (product: Product) => {
    setSelectedProduct(product)
    setDetailQty(1)
    if (user?.id) {
      try {
        await fetch(`/api/products/${product.id}?customerId=${user.id}`)
      } catch { /* silent */ }
    }
  }

  const openCheckout = () => {
    setCheckoutStep(1)
    setPaymentMethod('COD')
    setCardForm({ number: '', expiry: '', cvv: '', name: '' })
    setMobileBankPhone('')
    setMobileBankProvider('bkash')
    setShippingErrors({})
    setCardErrors({})
    setMobileBankErrors({})
    if (user) {
      setShippingForm({
        fullName: user.name || '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
      })
    }
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  // AI Image Search Handler
  const handleImageSearch = async (file: File) => {
    setImageSearchLoading(true)
    setImageSearchResults([])
    setImageSearchAnalysis('')
    setImageSearchTags([])
    setImageSearchCategory('')
    setImageSearchStyle('')

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setUploadedImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/ai/image-search', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.results) {
        setImageSearchResults(data.results)
        setImageSearchAnalysis(data.analysis || '')
        setImageSearchTags(data.identifiedTags || [])
        setImageSearchCategory(data.identifiedCategory || '')
        setImageSearchStyle(data.style || '')
      }
    } catch (err) {
      console.error('AI Image Search error:', err)
    } finally {
      setImageSearchLoading(false)
    }
  }

  const closeImageSearch = () => {
    setImageSearchOpen(false)
    setImageSearchResults([])
    setImageSearchAnalysis('')
    setImageSearchTags([])
    setImageSearchCategory('')
    setImageSearchStyle('')
    setUploadedImagePreview(null)
  }

  const validateShipping = (): boolean => {
    const errors: Record<string, string> = {}
    if (!shippingForm.fullName.trim()) errors.fullName = 'Full name is required'
    if (!shippingForm.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^\+?\d{10,15}$/.test(shippingForm.phone.replace(/\s/g, ''))) errors.phone = 'Invalid phone number'
    if (!shippingForm.address.trim()) errors.address = 'Address is required'
    if (!shippingForm.city.trim()) errors.city = 'City is required'
    if (!shippingForm.postalCode.trim()) errors.postalCode = 'Postal code is required'
    setShippingErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCard = (): boolean => {
    const errors: Record<string, string> = {}
    const num = cardForm.number.replace(/\s/g, '')
    if (!num) errors.number = 'Card number is required'
    else if (num.length < 13) errors.number = 'Card number is too short'
    if (!cardForm.expiry.trim()) errors.expiry = 'Expiry date is required'
    else {
      const expDigits = cardForm.expiry.replace(/\D/g, '')
      if (expDigits.length < 4) errors.expiry = 'Invalid expiry date'
      else {
        const month = parseInt(expDigits.slice(0, 2))
        if (month < 1 || month > 12) errors.expiry = 'Invalid month'
      }
    }
    if (!cardForm.cvv.trim()) errors.cvv = 'CVV is required'
    else if (cardForm.cvv.length < 3) errors.cvv = 'CVV must be 3-4 digits'
    if (!cardForm.name.trim()) errors.name = 'Cardholder name is required'
    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateMobileBank = (): boolean => {
    const errors: Record<string, string> = {}
    if (!mobileBankPhone.trim()) errors.phone = 'Phone number is required'
    else if (!/^01\d{9}$/.test(mobileBankPhone)) errors.phone = 'Enter a valid BD number (01XXXXXXXXX)'
    setMobileBankErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePayment = (): boolean => {
    if (paymentMethod === 'COD') return true
    if (paymentMethod === 'CARD') return validateCard()
    if (paymentMethod === 'MOBILE_BANKING') return validateMobileBank()
    return true
  }

  const handlePlaceOrder = async () => {
    if (!user?.id) return
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.')
      return
    }
    setPlacingOrder(true)
    try {
      const fullAddress = `${shippingForm.address}, ${shippingForm.city} ${shippingForm.postalCode}`
      const body: Record<string, unknown> = {
        customerId: user.id,
        shippingAddress: fullAddress,
        paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
        })),
      }
      if (paymentMethod === 'CARD') {
        body.cardNumber = cardForm.number.replace(/\s/g, '').slice(-4).padStart(cardForm.number.replace(/\s/g, '').slice(-4).length, '*')
      }
      if (paymentMethod === 'MOBILE_BANKING') {
        body.mobileBankProvider = mobileBankProvider
        body.mobileBankPhone = mobileBankPhone
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.order) {
        setOrderNumber(data.order.orderNumber)
        clearCart()
        setCheckoutOpen(false)
        setCheckoutStep(1)
        // Fetch updated orders and products (stock quantities may have changed)
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`/api/orders?customerId=${user.id}`),
          fetch('/api/products'),
        ])
        const ordersData = await ordersRes.json()
        const productsData = await productsRes.json()
        if (ordersData.orders) setOrders(ordersData.orders)
        if (productsData.products) setProducts(productsData.products)
        setActiveTab('orders')
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch (err) {
      console.error('Order error:', err)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (cartItems.length === 0) return
      setCheckoutStep(2)
    } else if (checkoutStep === 2) {
      if (validateShipping()) setCheckoutStep(3)
    } else if (checkoutStep === 3) {
      if (validatePayment()) handlePlaceOrder()
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#060D1A] flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <button onClick={() => setActiveTab('shop')} className="flex-shrink-0">
            <h1 className="text-2xl font-bold tracking-wider text-gradient-blue">NEXUS</h1>
          </button>

          {/* Center Search */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-4 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4F8CFF]/40 focus:bg-white/8 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative text-white/70 hover:text-white hover:bg-white/5"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-[10px] font-bold text-black flex items-center justify-center"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/5">
                  <Avatar className="w-8 h-8 border border-[#4F8CFF]/30">
                    <AvatarFallback className="bg-[#0B1628] text-[#4F8CFF] text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-white/10 text-white" style={{ background: 'rgba(11, 22, 40, 0.98)', backdropFilter: 'blur(20px)' }}>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/50">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setActiveTab('orders')} className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer">
                  <Package className="w-4 h-4 mr-2" /> My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('history')} className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer">
                  <Eye className="w-4 h-4 mr-2" /> Browsing History
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'shop' && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hero Banner */}
              <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#060D1A] via-[#0B1628] to-[#0B1628]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a962' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl"
                  >
                    <p className="text-sm font-medium tracking-widest text-[#4F8CFF]/80 uppercase mb-3">
                      <Sparkles className="inline w-4 h-4 mr-1" /> AI-Powered Shopping
                    </p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
                      {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                    </h2>
                    <p className="text-base sm:text-lg text-white/50 max-w-lg mb-8">
                      Discover products uniquely curated for you by our AI engine. Your style, your preferences — perfectly matched.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                        variant="outline"
                        className="border-[#4F8CFF]/50 text-[#4F8CFF] hover:bg-[#4F8CFF]/10 hover:border-[#4F8CFF] h-11 px-6 rounded-lg"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Explore AI Picks
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => setImageSearchOpen(true)}
                        className="h-11 px-6 rounded-lg font-semibold text-sm"
                        style={{ background: 'linear-gradient(135deg, #00D4AA, #4F8CFF)', color: '#fff' }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Search by Image
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* AI Image Search Modal */}
              <Dialog open={imageSearchOpen} onOpenChange={(open) => { if (!open) closeImageSearch() }}>
                <DialogContent className="bg-[#0B1628] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white text-lg">
                      <ScanSearch className="w-5 h-5 text-[#00D4AA]" />
                      AI Image Recognition Search
                    </DialogTitle>
                    <DialogDescription className="text-white/50">
                      Upload a product image and our AI will find similar products from the store
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    {/* Upload Area */}
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                        uploadedImagePreview
                          ? 'border-[#4F8CFF]/30 bg-[#4F8CFF]/5'
                          : 'border-white/15 bg-white/[0.02] hover:border-[#4F8CFF]/30 hover:bg-[#4F8CFF]/5'
                      }`}
                    >
                      {uploadedImagePreview ? (
                        <div className="space-y-4">
                          <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden border border-white/10">
                            <img src={uploadedImagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              onClick={() => imageInputRef.current?.click()}
                              variant="outline"
                              size="sm"
                              className="border-[#4F8CFF]/30 text-[#4F8CFF] hover:bg-[#4F8CFF]/10"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Try Another Image
                            </Button>
                            <Button
                              onClick={closeImageSearch}
                              variant="ghost"
                              size="sm"
                              className="text-white/50 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" />
                              Close
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="block">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4AA]/20 to-[#4F8CFF]/20 flex items-center justify-center">
                              <Upload className="w-7 h-7 text-[#00D4AA]" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Drop an image or click to upload</p>
                              <p className="text-white/40 text-sm mt-1">Supports JPEG, PNG, WebP, GIF (max 10MB)</p>
                            </div>
                          </div>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageSearch(file)
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Loading State */}
                    {imageSearchLoading && (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <motion.div
                          className="w-12 h-12 rounded-full border-2 border-[#4F8CFF]/20 border-t-[#4F8CFF]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="text-center">
                          <p className="text-white font-medium">Analyzing your image...</p>
                          <p className="text-white/40 text-sm mt-1">Our AI is identifying products and finding matches</p>
                        </div>
                      </div>
                    )}

                    {/* Analysis Results */}
                    {!imageSearchLoading && imageSearchAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#00D4AA]" />
                          <span className="text-sm font-semibold text-white">AI Analysis</span>
                        </div>
                        <p className="text-white/70 text-sm mb-3">{imageSearchAnalysis}</p>
                        <div className="flex flex-wrap gap-2">
                          {imageSearchCategory && (
                            <Badge className="bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/25 text-xs">{imageSearchCategory}</Badge>
                          )}
                          {imageSearchStyle && (
                            <Badge className="bg-[#00D4AA]/15 text-[#00D4AA] border-[#00D4AA]/25 text-xs">{imageSearchStyle}</Badge>
                          )}
                          {imageSearchTags.map((tag, i) => (
                            <Badge key={i} className="bg-white/5 text-white/60 border-white/10 text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Search Results */}
                    {!imageSearchLoading && imageSearchResults.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center gap-2 mb-4">
                          <ImageIcon className="w-4 h-4 text-[#4F8CFF]" />
                          <span className="text-sm font-semibold text-white">
                            {imageSearchResults.length} Similar Products Found
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {imageSearchResults.map((product, idx) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.06 }}
                              className="glass rounded-xl overflow-hidden cursor-pointer group hover:border-[#4F8CFF]/20 border border-transparent transition-all"
                              onClick={() => { closeImageSearch(); handleQuickView(product) }}
                            >
                              <div className="relative w-full aspect-square bg-gradient-to-br from-[#0B1628] to-[#111D33] flex items-center justify-center text-3xl overflow-hidden">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                ) : (
                                  <span>{CATEGORY_ICONS[product.category] || '🛍️'}</span>
                                )}
                                <Badge className="absolute top-2 right-2 bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/30 text-[10px] font-semibold">
                                  {Math.round((product.matchScore ?? 0) * 100)}% match
                                </Badge>
                              </div>
                              <div className="p-3">
                                <h4 className="text-xs font-medium text-white truncate group-hover:text-[#4F8CFF] transition-colors">{product.name}</h4>
                                <p className="text-xs font-semibold text-white mt-1">{formatPrice(product.discountPrice ?? product.price)}</p>
                                {product.matchReason && (
                                  <p className="text-[10px] text-white/30 mt-1 truncate">{product.matchReason}</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* No Results */}
                    {!imageSearchLoading && uploadedImagePreview && imageSearchResults.length === 0 && imageSearchAnalysis && (
                      <div className="flex flex-col items-center py-8 text-white/40">
                        <Search className="w-10 h-10 mb-3" />
                        <p className="font-medium">No matching products found</p>
                        <p className="text-sm mt-1">Try uploading a clearer product image</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* AI Recommendations */}
              {recommendations.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-[#4F8CFF] to-transparent" />
                      <h3 className="text-lg font-semibold text-white">AI Curated For You</h3>
                      <Badge className="bg-[#00D4AA]/15 text-[#00D4AA] border-[#00D4AA]/25 text-[10px] font-semibold py-0.5">
                        <Sparkles className="w-3 h-3 mr-1" />AI Powered
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchRecommendations}
                      disabled={loadingRecommendations}
                      className="text-white/40 hover:text-[#4F8CFF] hover:bg-[#4F8CFF]/10 text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingRecommendations ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <div ref={recScrollRef} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                    {recommendations.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="card-3d"
                      >
                        <div
                          className="card-3d-inner glass rounded-xl p-4 w-56 sm:w-64 flex-shrink-0 cursor-pointer group border border-transparent hover:border-[#4F8CFF]/20 relative overflow-hidden"
                          onClick={() => handleQuickView(product)}
                        >
                          <div className="card-shine rounded-xl" />
                          <div className="relative w-full aspect-square rounded-lg bg-gradient-to-br from-[#0B1628] to-[#0B1628] mb-3 flex items-center justify-center text-4xl overflow-hidden">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span>{CATEGORY_ICONS[product.category] || '🛍️'}</span>
                            )}
                            <Badge className="absolute top-2 right-2 bg-[#4F8CFF]/20 text-[#4F8CFF] border-[#4F8CFF]/30 text-[10px] font-semibold">
                              {Math.round((product.recommendationScore ?? 0) * 100)}% match
                            </Badge>
                          </div>
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-[#4F8CFF] transition-colors">{product.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-semibold text-white">
                              {formatPrice(product.discountPrice ?? product.price)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 text-white/40 hover:text-[#4F8CFF] hover:bg-[#4F8CFF]/10"
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {product.recommendationReason && (
                            <p className="text-[11px] text-white/30 mt-1.5 truncate">{product.recommendationReason}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Mobile Search */}
              <div className="sm:hidden px-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#4F8CFF]/40"
                  />
                </div>
              </div>

              {/* Product Catalog */}
              <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black shadow-lg shadow-[#4F8CFF]/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageSearchOpen(true)}
                      className="h-9 border-[#00D4AA]/30 text-[#00D4AA] hover:bg-[#00D4AA]/10 hover:border-[#00D4AA]/40 text-xs gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      AI Image Search
                    </Button>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 h-9 bg-white/5 border-white/10 text-white/70 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1628] border-white/10">
                      <SelectItem value="newest" className="text-white/80">Newest First</SelectItem>
                      <SelectItem value="price-asc" className="text-white/80">Price: Low → High</SelectItem>
                      <SelectItem value="price-desc" className="text-white/80">Price: High → Low</SelectItem>
                      <SelectItem value="rating" className="text-white/80">Top Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Grid */}
                {loadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="glass rounded-xl overflow-hidden">
                        <Skeleton className="w-full aspect-square bg-white/5" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-4 w-3/4 bg-white/5" />
                          <Skeleton className="h-4 w-1/2 bg-white/5" />
                          <Skeleton className="h-9 w-full bg-white/5 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-white/30">
                    <ShoppingBag className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {filteredProducts.map((product) => (
                      <motion.div key={product.id} variants={fadeUp} className="card-3d">
                        <div className="card-3d-inner glass rounded-xl overflow-hidden cursor-pointer group border border-transparent hover:border-[#4F8CFF]/20 relative">
                          <div className="card-shine rounded-xl" />
                          {/* Image */}
                          <div
                            className="relative w-full aspect-[4/5] bg-gradient-to-br from-[#0B1628] to-[#0B1628] flex items-center justify-center text-5xl overflow-hidden"
                            onClick={() => handleQuickView(product)}
                          >
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                            ) : (
                              <span className="group-hover:scale-110 transition-transform duration-500">
                                {CATEGORY_ICONS[product.category] || '🛍️'}
                              </span>
                            )}
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                              {product.discountPrice && product.discountPrice < product.price && (
                                <Badge className="bg-red-500/90 text-white border-none text-[10px] font-bold uppercase tracking-wider">
                                  SALE
                                </Badge>
                              )}
                              {product.isFeatured && (
                                <Badge className="bg-[#4F8CFF]/90 text-black border-none text-[10px] font-bold uppercase tracking-wider">
                                  FEATURED
                                </Badge>
                              )}
                            </div>
                            {/* Quick actions overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                              <Button
                                size="sm"
                                className="bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 h-8 text-xs"
                                onClick={(e) => { e.stopPropagation(); handleQuickView(product) }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Quick View
                              </Button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-4">
                            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">{product.category}</p>
                            <h4
                              className="text-sm font-medium text-white truncate group-hover:text-[#4F8CFF] transition-colors cursor-pointer"
                              onClick={() => handleQuickView(product)}
                            >
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-2">
                              <StarRating rating={product.rating} />
                              <span className="text-[11px] text-white/30">({product.reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2.5">
                              <span className="text-base font-bold text-white">
                                {formatPrice(product.discountPrice ?? product.price)}
                              </span>
                              {product.discountPrice && product.discountPrice < product.price && (
                                <span className="text-xs text-white/30 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>
                            <Button
                              className="w-full mt-3 h-9 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black text-xs font-semibold hover:shadow-lg hover:shadow-[#4F8CFF]/20 transition-all"
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Add to Cart
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
              {/* Success banner for newly placed order */}
              {orderNumber && orders.length > 0 && orders[0]?.orderNumber === orderNumber && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="mb-6 rounded-xl bg-gradient-to-r from-[#4F8CFF]/20 via-[#4F8CFF]/10 to-transparent border border-[#4F8CFF]/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-black" strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold">Order Placed Successfully!</h3>
                      <p className="text-sm text-white/50 mt-0.5">Your order <span className="font-mono text-[#4F8CFF]">{orderNumber}</span> has been confirmed and will be processed shortly.</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white/30 hover:text-white flex-shrink-0" onClick={() => setOrderNumber('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setActiveTab('shop')} className="text-white/50 hover:text-white hover:bg-white/5">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-white">My Orders</h2>
                <span className="text-sm text-white/30 ml-auto">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
              </div>

              {loadingOrders ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full bg-white/5 rounded-xl" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-white/30">
                  <Package className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">No orders yet</p>
                  <p className="text-sm mt-1">Your orders will appear here</p>
                  <Button variant="outline" className="mt-4 border-[#4F8CFF]/50 text-[#4F8CFF] hover:bg-[#4F8CFF]/10" onClick={() => setActiveTab('shop')}>
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
                  {orders.map((order) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                    const isCancelled = order.status === 'CANCELLED'
                    const isDelivered = order.status === 'DELIVERED'
                    return (
                      <motion.div key={order.id} variants={fadeUp}>
                        <div className="glass rounded-xl border border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                          {/* Order header */}
                          <div className="p-5 pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Order</p>
                                <p className="text-sm font-mono font-semibold text-white">{order.orderNumber}</p>
                              </div>
                              <Badge variant="outline" className={`${statusCfg.color} border text-xs gap-1.5 w-fit`}>
                                {statusCfg.icon} {statusCfg.label}
                              </Badge>
                              <div className="text-right">
                                <p className="text-xs text-white/40">Total</p>
                                <p className="text-lg font-bold text-[#4F8CFF]">{formatPrice(order.totalAmount)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tracking progress bar (not for cancelled) */}
                          {!isCancelled && (
                            <div className="px-5 pb-4">
                              <div className="relative flex items-center justify-between">
                                {/* Progress line background */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2" />
                                {/* Progress line filled */}
                                <div
                                  className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] -translate-y-1/2 transition-all duration-700"
                                  style={{ width: `${Math.max((statusCfg.step - 1) / (TRACKING_STEPS.length - 1) * 100, isDelivered ? 100 : 0)}%` }}
                                />
                                {TRACKING_STEPS.map((step, idx) => {
                                  const isComplete = idx < statusCfg.step
                                  const isCurrent = idx === statusCfg.step - 1
                                  return (
                                    <div key={idx} className="relative flex flex-col items-center z-10">
                                      <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                                          isComplete || isDelivered
                                            ? 'bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] text-black'
                                            : isCurrent
                                            ? 'bg-[#0B1628] border-2 border-[#4F8CFF] text-[#4F8CFF]'
                                            : 'bg-[#0B1628] border-2 border-white/10 text-white/30'
                                        }`}
                                      >
                                        {isComplete || isDelivered ? <Check className="w-3 h-3" strokeWidth={3} /> : step.icon}
                                      </div>
                                      <span className={`text-[10px] mt-1.5 hidden sm:block ${isCurrent ? 'text-[#4F8CFF] font-medium' : isComplete || isDelivered ? 'text-white/60' : 'text-white/20'}`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <Separator className="bg-white/5" />

                          {/* Order items */}
                          <div className="p-5 space-y-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {item.product?.imageUrl ? (
                                    <img src={item.product.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-white/20" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{item.productName}</p>
                                  <p className="text-xs text-white/40">Qty: {item.quantity} × {formatPrice(item.productPrice)}</p>
                                </div>
                                <span className="text-sm font-semibold text-white">{formatPrice(item.productPrice * item.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Order footer */}
                          <div className="px-5 py-3 bg-white/[0.02] rounded-b-xl flex items-center justify-between text-xs text-white/30">
                            <span>{formatDate(order.createdAt)}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setInvoiceOrderId(order.id)}
                                className="flex items-center gap-1 text-[#4F8CFF] hover:text-[#7AB3FF] transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" /> Invoice
                              </button>
                              <span className="flex items-center gap-1">
                                {order.paymentMethod && <CreditCard className="w-3 h-3" />}
                                {order.paymentMethod || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setActiveTab('shop')} className="text-white/50 hover:text-white hover:bg-white/5">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-white">Browsing History</h2>
              </div>

              {loadingHistory ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square bg-white/5 rounded-xl" />
                  ))}
                </div>
              ) : browsingHistory.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-white/30">
                  <Eye className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">No browsing history</p>
                  <p className="text-sm mt-1">Products you view will appear here</p>
                </div>
              ) : (
                <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" variants={staggerContainer} initial="hidden" animate="show">
                  {browsingHistory.map((item) => (
                    <motion.div key={item.id} variants={scaleIn}>
                      <div
                        className="glass rounded-xl overflow-hidden card-hover cursor-pointer group border border-transparent hover:border-[#4F8CFF]/20"
                        onClick={() => handleQuickView(item.product)}
                      >
                        <div className="relative w-full aspect-square bg-gradient-to-br from-[#0B1628] to-[#0B1628] flex items-center justify-center text-3xl">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{CATEGORY_ICONS[item.product.category] || '🛍️'}</span>
                          )}
                          <Badge className="absolute bottom-2 right-2 bg-black/60 text-white/70 text-[10px] border-none backdrop-blur-sm">
                            {item.viewCount} views
                          </Badge>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-medium text-white truncate group-hover:text-[#4F8CFF] transition-colors">{item.product.name}</h4>
                          <p className="text-xs font-semibold text-white mt-1">{formatPrice(item.product.discountPrice ?? item.product.price)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── PRODUCT DETAIL MODAL ── */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null) }}>
        {selectedProduct && (
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0B1628] border-white/10 p-0" showCloseButton>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative aspect-square md:aspect-auto bg-gradient-to-br from-[#060D1A] to-[#0B1628] flex items-center justify-center text-7xl">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{CATEGORY_ICONS[selectedProduct.category] || '🛍️'}</span>
                )}
                {selectedProduct.discountPrice && selectedProduct.discountPrice < selectedProduct.price && (
                  <Badge className="absolute top-4 left-4 bg-red-500/90 text-white border-none text-xs font-bold uppercase">Sale</Badge>
                )}
              </div>
              {/* Details */}
              <div className="p-6 sm:p-8 flex flex-col">
                <p className="text-xs text-[#4F8CFF] uppercase tracking-widest mb-2">{selectedProduct.category}{selectedProduct.subcategory ? ` / ${selectedProduct.subcategory}` : ''}</p>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-3">{selectedProduct.name}</DialogTitle>
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={selectedProduct.rating} size="md" />
                  <span className="text-sm text-white/40">({selectedProduct.reviewCount} reviews)</span>
                </div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-2xl font-bold text-white">{formatPrice(selectedProduct.discountPrice ?? selectedProduct.price)}</span>
                  {selectedProduct.discountPrice && selectedProduct.discountPrice < selectedProduct.price && (
                    <span className="text-base text-white/30 line-through">{formatPrice(selectedProduct.price)}</span>
                  )}
                </div>
                <DialogDescription className="text-sm text-white/50 leading-relaxed mb-6">
                  {selectedProduct.description}
                </DialogDescription>

                {/* Tags */}
                {selectedProduct.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {selectedProduct.tags.split(',').filter(Boolean).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] text-white/40 border-white/10 bg-white/3">
                        <Tag className="w-2.5 h-2.5 mr-1" />{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Seller */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                  <span className="text-white/30">Sold by</span>
                  <span className="text-[#4F8CFF] font-medium">{selectedProduct.seller.name}</span>
                </div>

                <div className="mt-auto space-y-3">
                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">Quantity</span>
                    <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                      <button
                        className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 h-9 flex items-center justify-center text-sm font-semibold text-white border-x border-white/10">
                        {detailQty}
                      </span>
                      <button
                        className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDetailQty(Math.min(selectedProduct.stockQuantity, detailQty + 1))}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-white/30">{selectedProduct.stockQuantity} in stock</span>
                  </div>

                  {/* Buttons */}
                  <Button
                    className="w-full h-11 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black font-semibold hover:shadow-lg hover:shadow-[#4F8CFF]/20"
                    onClick={() => {
                      handleAddToCart(selectedProduct, detailQty)
                      setSelectedProduct(null)
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 border-[#4F8CFF]/50 text-[#4F8CFF] hover:bg-[#4F8CFF]/10"
                    onClick={() => {
                      handleAddToCart(selectedProduct, detailQty)
                      setSelectedProduct(null)
                      openCheckout()
                    }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── SHOPPING CART SHEET ── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#060D1A]/95 backdrop-blur-xl border-l border-white/10 p-0">
          <SheetHeader className="p-5 pb-3 border-b border-white/5">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#4F8CFF]" />
              Shopping Cart
              {cartCount > 0 && (
                <Badge className="bg-[#4F8CFF]/20 text-[#4F8CFF] border-[#4F8CFF]/30 text-xs">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-white/30">
                <ShoppingBag className="w-10 h-10 mb-3" />
                <p className="text-sm font-medium">Your cart is empty</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                      className="glass rounded-lg p-3 border border-white/5"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0B1628] to-[#0B1628] flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            '🛍️'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{item.productName}</h4>
                          <p className="text-sm font-semibold text-[#4F8CFF] mt-0.5">{formatPrice(item.productPrice)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-white/10 rounded-md overflow-hidden">
                              <button
                                className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
                                onClick={() => {
                                  if (item.quantity <= 1) removeFromCart(item.productId)
                                  else updateCartQuantity(item.productId, item.quantity - 1)
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 h-7 flex items-center justify-center text-xs font-semibold text-white border-x border-white/10">
                                {item.quantity}
                              </span>
                              <button
                                className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
                                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              className="text-white/20 hover:text-red-400 transition-colors"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {cartItems.length > 0 && (
            <div className="border-t border-white/5 p-5 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </span>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-white font-bold text-lg">{formatPrice(cartTotal)}</span>
                </div>
              </div>
              <Button
                className="w-full h-11 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black font-semibold hover:shadow-lg hover:shadow-[#4F8CFF]/20"
                onClick={openCheckout}
              >
                Proceed to Checkout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── CHECKOUT DIALOG ── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B1628] border-white/10 p-0"
          showCloseButton={checkoutStep < 3 || !placingOrder}
        >
          {/* Step Indicator */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Checkout</h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {[
                { num: 1, label: 'Summary' },
                { num: 2, label: 'Shipping' },
                { num: 3, label: 'Payment' },
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      checkoutStep >= step.num
                        ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {checkoutStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${
                      checkoutStep >= step.num ? 'text-white' : 'text-white/30'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className={`flex-1 h-px mx-2 transition-colors ${
                      checkoutStep > step.num ? 'bg-[#4F8CFF]' : 'bg-white/10'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Order Summary */}
            {checkoutStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                <h3 className="text-base font-semibold text-white mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#060D1A] to-[#0B1628] flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : '🛍️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.productName}</p>
                        <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatPrice(item.productPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm p-4 rounded-lg bg-white/3 border border-white/5">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span><span className="text-white">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400' : 'text-white'}>
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-white">Total</span>
                    <span className="font-bold text-white">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-11 mt-6 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black font-semibold"
                  onClick={() => setCheckoutStep(2)}
                >
                  Continue to Shipping
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Shipping Address */}
            {checkoutStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setCheckoutStep(1)} className="text-white/40 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-semibold text-white">Shipping Address</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-white/50 mb-1.5 block">Full Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={shippingForm.fullName}
                      onChange={(e) => { setShippingForm({ ...shippingForm, fullName: e.target.value }); setShippingErrors({ ...shippingErrors, fullName: '' }) }}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10"
                    />
                    {shippingErrors.fullName && <p className="text-xs text-red-400 mt-1">{shippingErrors.fullName}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1.5 block">Phone Number *</Label>
                    <Input
                      placeholder="+880 1XXX XXXXXX"
                      value={shippingForm.phone}
                      onChange={(e) => { setShippingForm({ ...shippingForm, phone: e.target.value }); setShippingErrors({ ...shippingErrors, phone: '' }) }}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10"
                    />
                    {shippingErrors.phone && <p className="text-xs text-red-400 mt-1">{shippingErrors.phone}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1.5 block">Street Address *</Label>
                    <textarea
                      placeholder="House #, Road #, Area"
                      value={shippingForm.address}
                      onChange={(e) => { setShippingForm({ ...shippingForm, address: e.target.value }); setShippingErrors({ ...shippingErrors, address: '' }) }}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4F8CFF]/50 resize-none"
                    />
                    {shippingErrors.address && <p className="text-xs text-red-400 mt-1">{shippingErrors.address}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-white/50 mb-1.5 block">City *</Label>
                      <Input
                        placeholder="Dhaka"
                        value={shippingForm.city}
                        onChange={(e) => { setShippingForm({ ...shippingForm, city: e.target.value }); setShippingErrors({ ...shippingErrors, city: '' }) }}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10"
                      />
                      {shippingErrors.city && <p className="text-xs text-red-400 mt-1">{shippingErrors.city}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1.5 block">Postal Code *</Label>
                      <Input
                        placeholder="1205"
                        value={shippingForm.postalCode}
                        onChange={(e) => { setShippingForm({ ...shippingForm, postalCode: e.target.value }); setShippingErrors({ ...shippingErrors, postalCode: '' }) }}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10"
                      />
                      {shippingErrors.postalCode && <p className="text-xs text-red-400 mt-1">{shippingErrors.postalCode}</p>}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full h-11 mt-6 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black font-semibold"
                  onClick={handleNextStep}
                >
                  Continue to Payment
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* STEP 3: Payment Method */}
            {checkoutStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setCheckoutStep(2)} className="text-white/40 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-semibold text-white">Payment Method</h3>
                </div>

                <div className="space-y-4">
                  {/* COD Option */}
                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`w-full text-left rounded-xl p-5 border-2 transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/5 glow-blue'
                        : 'border-white/5 bg-white/3 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === 'COD' ? 'bg-[#4F8CFF]/20' : 'bg-white/5'
                      }`}>
                        <Banknote className={`w-6 h-6 ${paymentMethod === 'COD' ? 'text-[#4F8CFF]' : 'text-white/40'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold ${paymentMethod === 'COD' ? 'text-[#4F8CFF]' : 'text-white'}`}>
                            Cash on Delivery
                          </h4>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentMethod === 'COD'
                              ? 'border-[#4F8CFF] bg-[#4F8CFF]'
                              : 'border-white/20'
                          }`}>
                            {paymentMethod === 'COD' && <Check className="w-3 h-3 text-black" />}
                          </div>
                        </div>
                        <p className="text-sm text-white/40 mt-1">Pay when you receive your order</p>
                        <p className="text-xs text-emerald-400/70 mt-1">No additional fees</p>
                      </div>
                    </div>
                  </button>

                  {/* Credit/Debit Card Option */}
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
                      paymentMethod === 'CARD'
                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                        : 'border-white/5 bg-white/3 hover:border-white/10'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'CARD' ? 'bg-[#4F8CFF]/20' : 'bg-white/5'
                        }`}>
                          <CreditCard className={`w-6 h-6 ${paymentMethod === 'CARD' ? 'text-[#4F8CFF]' : 'text-white/40'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold ${paymentMethod === 'CARD' ? 'text-[#4F8CFF]' : 'text-white'}`}>
                              Credit / Debit Card
                            </h4>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentMethod === 'CARD'
                                ? 'border-[#4F8CFF] bg-[#4F8CFF]'
                                : 'border-white/20'
                            }`}>
                              {paymentMethod === 'CARD' && <Check className="w-3 h-3 text-black" />}
                            </div>
                          </div>
                          <p className="text-sm text-white/40 mt-1">Visa, Mastercard, American Express</p>
                          <div className="flex items-center gap-2 mt-2">
                            {['VISA', 'MC', 'AMEX'].map((brand) => {
                              const isActive =
                                (brand === 'VISA' && detectCardBrand(cardForm.number) === 'visa') ||
                                (brand === 'MC' && detectCardBrand(cardForm.number) === 'mastercard') ||
                                (brand === 'AMEX' && detectCardBrand(cardForm.number) === 'amex')
                              return (
                                <span
                                  key={brand}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
                                    isActive
                                      ? 'bg-white/10 text-white border-white/20'
                                      : 'bg-white/3 text-white/25 border-white/5'
                                  }`}
                                >
                                  {brand}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Form (expanded) */}
                    <AnimatePresence>
                      {paymentMethod === 'CARD' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                            <div>
                              <Label className="text-xs text-white/50 mb-1.5 block">Card Number *</Label>
                              <div className="relative">
                                <Input
                                  placeholder="XXXX XXXX XXXX XXXX"
                                  value={formatCardNumber(cardForm.number)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 16)
                                    setCardForm({ ...cardForm, number: val })
                                    setCardErrors({ ...cardErrors, number: '' })
                                  }}
                                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10 pr-16 ${cardErrors.number ? 'border-red-500/50' : ''}`}
                                />
                                {detectCardBrand(cardForm.number) && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                    {detectCardBrand(cardForm.number) === 'visa' ? 'VISA' : detectCardBrand(cardForm.number) === 'mastercard' ? 'MC' : 'AMEX'}
                                  </span>
                                )}
                              </div>
                              {cardErrors.number && <p className="text-xs text-red-400 mt-1">{cardErrors.number}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-white/50 mb-1.5 block">Expiry Date *</Label>
                                <Input
                                  placeholder="MM/YY"
                                  value={formatExpiry(cardForm.expiry)}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                    setCardForm({ ...cardForm, expiry: val })
                                    setCardErrors({ ...cardErrors, expiry: '' })
                                  }}
                                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10 ${cardErrors.expiry ? 'border-red-500/50' : ''}`}
                                />
                                {cardErrors.expiry && <p className="text-xs text-red-400 mt-1">{cardErrors.expiry}</p>}
                              </div>
                              <div>
                                <Label className="text-xs text-white/50 mb-1.5 block">CVV *</Label>
                                <Input
                                  type="password"
                                  placeholder="•••"
                                  value={cardForm.cvv}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                                    setCardForm({ ...cardForm, cvv: val })
                                    setCardErrors({ ...cardErrors, cvv: '' })
                                  }}
                                  className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10 ${cardErrors.cvv ? 'border-red-500/50' : ''}`}
                                />
                                {cardErrors.cvv && <p className="text-xs text-red-400 mt-1">{cardErrors.cvv}</p>}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-white/50 mb-1.5 block">Cardholder Name *</Label>
                              <Input
                                placeholder="JOHN DOE"
                                value={cardForm.name}
                                onChange={(e) => {
                                  setCardForm({ ...cardForm, name: e.target.value })
                                  setCardErrors({ ...cardErrors, name: '' })
                                }}
                                className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10 uppercase ${cardErrors.name ? 'border-red-500/50' : ''}`}
                              />
                              {cardErrors.name && <p className="text-xs text-red-400 mt-1">{cardErrors.name}</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Mobile Banking Option */}
                  <div
                    onClick={() => setPaymentMethod('MOBILE_BANKING')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('MOBILE_BANKING')}
                    className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden cursor-pointer ${
                      paymentMethod === 'MOBILE_BANKING'
                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                        : 'border-white/5 bg-white/3 hover:border-white/10'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'MOBILE_BANKING' ? 'bg-[#4F8CFF]/20' : 'bg-white/5'
                        }`}>
                          <Smartphone className={`w-6 h-6 ${paymentMethod === 'MOBILE_BANKING' ? 'text-[#4F8CFF]' : 'text-white/40'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold ${paymentMethod === 'MOBILE_BANKING' ? 'text-[#4F8CFF]' : 'text-white'}`}>
                              Mobile Banking
                            </h4>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentMethod === 'MOBILE_BANKING'
                                ? 'border-[#4F8CFF] bg-[#4F8CFF]'
                                : 'border-white/20'
                            }`}>
                              {paymentMethod === 'MOBILE_BANKING' && <Check className="w-3 h-3 text-black" />}
                            </div>
                          </div>
                          <p className="text-sm text-white/40 mt-1">Pay via mobile financial services</p>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {paymentMethod === 'MOBILE_BANKING' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                            {/* Provider Selection */}
                            <div>
                              <Label className="text-xs text-white/50 mb-2 block">Select Provider</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {MOBILE_BANK_PROVIDERS.map((provider) => (
                                  <button
                                    key={provider.id}
                                    onClick={(e) => { e.stopPropagation(); setMobileBankProvider(provider.id) }}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      mobileBankProvider === provider.id
                                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                                        : 'border-white/5 bg-white/3 hover:border-white/10'
                                    }`}
                                  >
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ backgroundColor: provider.color + '30', color: provider.color }}
                                    >
                                      {provider.name.charAt(0)}
                                    </div>
                                    <span className={`text-sm font-medium ${mobileBankProvider === provider.id ? 'text-[#4F8CFF]' : 'text-white/70'}`}>
                                      {provider.name}
                                    </span>
                                    {mobileBankProvider === provider.id && (
                                      <Check className="w-4 h-4 text-[#4F8CFF] ml-auto" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Phone Number */}
                            <div>
                              <Label className="text-xs text-white/50 mb-1.5 block">Account Phone Number *</Label>
                              <Input
                                placeholder="01XXXXXXXXX"
                                value={mobileBankPhone}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                                  setMobileBankPhone(val)
                                  setMobileBankErrors({ ...mobileBankErrors, phone: '' })
                                }}
                                className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#4F8CFF]/50 h-10 ${mobileBankErrors.phone ? 'border-red-500/50' : ''}`}
                              />
                              {mobileBankErrors.phone && <p className="text-xs text-red-400 mt-1">{mobileBankErrors.phone}</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Secure Payment</p>
                      <p className="text-xs text-white/30">Your payment info is encrypted and secure</p>
                    </div>
                    <Shield className="w-5 h-5 text-emerald-400/30 ml-auto flex-shrink-0" />
                  </div>
                </div>

                {/* Order Total */}
                <div className="mt-6 p-4 rounded-lg bg-white/3 border border-white/5">
                  <div className="flex justify-between text-sm text-white/50 mb-1">
                    <span>Subtotal</span><span className="text-white">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/50 mb-2">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400' : 'text-white'}>
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="flex justify-between mt-2">
                    <span className="font-semibold text-white">Total</span>
                    <span className="font-bold text-lg text-white">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  className="w-full h-12 mt-6 bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF] text-black font-bold text-base hover:shadow-xl hover:shadow-[#4F8CFF]/30 transition-all disabled:opacity-50"
                  onClick={handleNextStep}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Place Order — {formatPrice(cartTotal)}
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* ── ORDER SUCCESS MODAL (kept for reference, but auto-redirects now) ── */}

      {/* ── ADDED TO CART TOAST ── */}
      <AnimatePresence>
        {cartToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#4F8CFF]/30 shadow-2xl"
              style={{ background: 'rgba(11, 22, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7AB3FF] flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Added to Cart!</p>
                <p className="text-xs text-white/50 truncate max-w-[200px]">{cartToast.name}</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-2 text-[#4F8CFF] hover:text-[#7AB3FF] hover:bg-[#4F8CFF]/10 text-xs font-medium rounded-lg"
                onClick={() => { setCheckoutOpen(true); setCartToast({ show: false, name: '' }) }}>
                Checkout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {invoiceOrderId && <InvoiceView orderId={invoiceOrderId} onClose={() => setInvoiceOrderId(null)} />}
    </div>
  )
}
