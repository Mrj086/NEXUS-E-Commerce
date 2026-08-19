'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Store,
  Bell,
  ChevronDown,
  ChevronLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
  LayoutDashboard,
  X,
  Check,
  Truck,
  CircleDot,
  ImageOff,
  Camera,
  LogOut,
  User,
  Settings,
  ArrowUpRight,
  Clock,
  Filter,
  Power,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPrice: number | null
  category: string
  subcategory: string | null
  tags: string
  targetAgeMin: number | null
  targetAgeMax: number | null
  targetProfessions: string | null
  stockQuantity: number
  imageUrl: string | null
  rating: number
  reviewCount: number
  isFeatured: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  sellerId: string
}

interface OrderItem {
  id: string
  productName: string
  productPrice: number
  quantity: number
  product?: { imageUrl?: string }
}

interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer?: { name: string; email: string }
  items: OrderItem[]
  totalAmount: number
  status: string
  shippingAddress: string
  paymentMethod: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface DashboardStats {
  productCount: number
  orderCount: number
  totalRevenue: number
  lowStockCount: number
  lowStockProducts: Product[]
  recentOrders: Order[]
}

type TabId = 'dashboard' | 'products' | 'orders' | 'payments' | 'analytics'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

const STATUS_FLOW: Record<string, OrderStatus | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SHIPPED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Garden', 'Sports',
  'Books', 'Beauty', 'Toys', 'Automotive', 'Food', 'Health',
]

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

const rowEnter = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

// ─── Shimmer Skeletons ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24 shimmer rounded" />
          <Skeleton className="h-9 w-32 shimmer rounded" />
          <Skeleton className="h-3 w-20 shimmer rounded" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full shimmer" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 px-4"><Skeleton className="h-4 w-24 shimmer rounded" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-36 shimmer rounded" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-16 shimmer rounded" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-20 shimmer rounded" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-14 shimmer rounded" /></td>
    </tr>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="glass rounded-xl p-5">
        <Skeleton className="h-5 w-40 shimmer rounded mb-4" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Order</th>
              <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Customer</th>
              <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Date</th>
              <th className="text-right text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Total</th>
              <th className="text-center text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Counter Animation ──────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = '', suffix = '', decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame: number
    const duration = 1200
    const start = performance.now()
    const from = 0

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return (
    <span className="tabular-nums">
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SellerPanel() {
  const { user, logout, setCurrentPanel } = useAppStore()
  const sellerId = user?.id || ''

  // ── State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)

  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<{ id: string; amount: number; type: string; status: string; createdAt: string; order: { orderNumber: string; totalAmount: number; status: string; customer: { name: string } } }[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  // Products filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Orders filter
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Product form
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    category: '', subcategory: '', tags: '',
    targetAgeMin: '', targetAgeMax: '', targetProfessions: '',
    stockQuantity: '', imageUrl: '', isFeatured: false,
  })
  const [saving, setSaving] = useState(false)

  // ── Data Fetching ───────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/seller?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || null)
      }
    } catch (e) { console.error('[Seller] fetchDashboard error:', e) }
  }, [sellerId])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      } else {
        console.error('[Seller] fetchProducts HTTP error:', res.status)
      }
    } catch (e) { console.error('[Seller] fetchProducts error:', e) }
  }, [sellerId])

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) { console.error('[Seller] fetchOrders error:', e) }
  }, [sellerId])

  const fetchPayments = useCallback(async () => {
    if (!sellerId) return
    try {
      const res = await fetch(`/api/payments?recipientId=${sellerId}&type=SELLER_EARNING`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setTotalEarnings(data.totalEarnings || 0)
      }
    } catch (e) { console.error('[Seller] fetchPayments error:', e) }
  }, [sellerId])

  useEffect(() => {
    if (!sellerId) return
    setLoading(true)
    let cancelled = false
    const load = async () => {
      try {
        await Promise.all([fetchDashboard(), fetchProducts(), fetchOrders(), fetchPayments()])
      } catch (e) {
        console.error('[Seller] Initial data load error:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    // Safety timeout: force loading to false after 8s no matter what
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)
    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
    }
  }, [sellerId])

  // Re-fetch individual data sources (for tab switches, CRUD ops, etc.)
  // These do NOT touch the loading state
  const refetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (e) { console.error('[Seller] refetchProducts error:', e) }
  }, [sellerId])

  const refetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/seller?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || null)
      }
    } catch (e) { console.error('[Seller] refetchDashboard error:', e) }
  }, [sellerId])

  const refetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?sellerId=${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) { console.error('[Seller] refetchOrders error:', e) }
  }, [sellerId])

  const refetchPayments = useCallback(async () => {
    if (!sellerId) return
    try {
      const res = await fetch(`/api/payments?recipientId=${sellerId}&type=SELLER_EARNING`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setTotalEarnings(data.totalEarnings || 0)
      }
    } catch (e) { console.error('[Seller] refetchPayments error:', e) }
  }, [sellerId])

  // Re-fetch relevant data when switching tabs
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'dashboard') { refetchDashboard(); refetchProducts() }
    else if (tab === 'products') refetchProducts()
    else if (tab === 'orders') refetchOrders()
    else if (tab === 'payments') refetchPayments()
  }

  // ── Product CRUD ────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '', description: '', price: '', discountPrice: '',
      category: '', subcategory: '', tags: '',
      targetAgeMin: '', targetAgeMax: '', targetProfessions: '',
      stockQuantity: '', imageUrl: '', isFeatured: false,
    })
    setProductDialogOpen(true)
  }

  const openEditProduct = (p: Product) => {
    setEditingProduct(p)
    setProductForm({
      name: p.name, description: p.description,
      price: String(p.price),
      discountPrice: p.discountPrice ? String(p.discountPrice) : '',
      category: p.category, subcategory: p.subcategory || '',
      tags: p.tags,
      targetAgeMin: p.targetAgeMin ? String(p.targetAgeMin) : '',
      targetAgeMax: p.targetAgeMax ? String(p.targetAgeMax) : '',
      targetProfessions: p.targetProfessions || '',
      stockQuantity: String(p.stockQuantity),
      imageUrl: p.imageUrl || '', isFeatured: p.isFeatured,
    })
    setProductDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) return
    setSaving(true)
    try {
      const body = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        discountPrice: productForm.discountPrice ? parseFloat(productForm.discountPrice) : null,
        targetAgeMin: productForm.targetAgeMin ? parseInt(productForm.targetAgeMin) : null,
        targetAgeMax: productForm.targetAgeMax ? parseInt(productForm.targetAgeMax) : null,
        stockQuantity: parseInt(productForm.stockQuantity) || 0,
        subcategory: productForm.subcategory || null,
        targetProfessions: productForm.targetProfessions || null,
        imageUrl: productForm.imageUrl || null,
      }
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const payload = editingProduct ? { ...body, id: editingProduct.id, sellerId } : { ...body, sellerId }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        setProductDialogOpen(false)
        await refetchProducts()
        await refetchDashboard()
      }
    } catch (e) { console.error('[Seller] saveProduct error:', e) }
    setSaving(false)
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeletingProduct(null)
        await refetchProducts()
        await refetchDashboard()
      }
    } catch { /* silent */ }
  }

  // ── Order Status ────────────────────────────────────────────────────────
  const toggleProductActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (res.ok) {
        await refetchProducts()
        await refetchDashboard()
      }
    } catch (e) { console.error('[Seller] toggleProductActive error:', e) }
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}?sellerId=${sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await refetchOrders()
        await refetchDashboard()
      }
    } catch (e) { console.error('[Seller] updateOrderStatus error:', e) }
  }

  // ── Computed ────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = products
    if (productStatusFilter === 'active') list = list.filter(p => p.isActive)
    else if (productStatusFilter === 'inactive') list = list.filter(p => !p.isActive)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter)
    return list
  }, [products, searchQuery, categoryFilter, productStatusFilter])

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders
    return orders.filter(o => o.status === orderStatusFilter)
  }, [orders, orderStatusFilter])

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1 })
    return c
  }, [orders])

  // Analytics computed
  const analytics = useMemo(() => {
    const totalRevenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.totalAmount, 0)
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED')
    const categoryRevenue: Record<string, number> = {}
    orders.filter(o => o.status !== 'CANCELLED').forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.name === item.productName)
        const cat = prod?.category || 'Other'
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.productPrice * item.quantity
      })
    })
    const statusBreakdown: Record<string, number> = {}
    orders.forEach(o => { statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1 })
    return { totalRevenue, avgOrderValue, deliveredCount: deliveredOrders.length, categoryRevenue, statusBreakdown }
  }, [orders, products])

  // ── Sidebar Nav Items ───────────────────────────────────────────────────
  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'payments', label: 'Payments', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  // ── Render Helpers ──────────────────────────────────────────────────────
  const stockIndicator = (qty: number) => {
    if (qty <= 0) return <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium"><CircleDot className="h-3 w-3" />Out</span>
    if (qty <= 5) return <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium"><AlertTriangle className="h-3 w-3" />{qty}</span>
    return <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium"><CircleDot className="h-3 w-3" />{qty}</span>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatCurrency = (n: number) => `$${n.toFixed(2)}`

  // ─── Sidebar ─────────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#a8893e] flex items-center justify-center flex-shrink-0">
          <Store className="h-5 w-5 text-[#060D1A]" />
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="text-sm font-bold tracking-wider text-gradient-blue">NEXUS SELLER</h1>
            <p className="text-[10px] text-white/40 tracking-wide">ADMIN PANEL</p>
          </div>
        )}
      </div>
      <Separator className="bg-white/5" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => { handleTabChange(item.id); setMobileSidebar(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group
                ${active
                  ? 'text-[#4F8CFF] bg-[#4F8CFF]/8'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/3'
                }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#4F8CFF]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className={active ? 'text-[#4F8CFF]' : 'text-white/40 group-hover:text-white/70'}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <Separator className="bg-white/5 mb-3" />
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  // ─── Dashboard Tab ───────────────────────────────────────────────────────
  const renderDashboard = () => {
    if (loading) return <DashboardSkeleton />

    const statCards = [
      { label: 'Total Products', value: stats?.productCount ?? products.length, icon: <Package className="h-5 w-5" />, change: '+12%', changeUp: true },
      { label: 'Total Orders', value: stats?.orderCount ?? orders.length, icon: <ShoppingCart className="h-5 w-5" />, change: '+8%', changeUp: true },
      { label: 'Revenue', value: stats?.totalRevenue ?? analytics.totalRevenue, icon: <DollarSign className="h-5 w-5" />, prefix: '$', decimals: 2, change: '+23%', changeUp: true, accent: true },
      { label: 'Low Stock', value: stats?.lowStockCount ?? products.filter(p => p.stockQuantity <= 5).length, icon: <AlertTriangle className="h-5 w-5" />, change: 'Alert', changeUp: false, alert: true },
    ]

    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={card.label}>
              <div className={`glass rounded-xl p-5 card-hover relative overflow-hidden ${card.accent ? 'glow-blue' : ''}`}>
                {card.accent && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F8CFF]/5 rounded-full -translate-y-8 translate-x-8" />
                )}
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{card.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${card.accent ? 'text-gradient-blue' : card.alert ? 'text-red-400' : 'text-white'}`}>
                      <AnimatedCounter
                        target={card.value as number}
                        prefix={(card as any).prefix || ''}
                        decimals={(card as any).decimals || 0}
                      />
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${card.alert ? 'text-amber-400' : 'text-emerald-400'}`}>
                      <ArrowUpRight className={`h-3 w-3 ${card.alert ? 'text-amber-400' : ''}`} />
                      {card.change}
                    </p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${card.accent
                    ? 'bg-gradient-to-br from-[#4F8CFF] to-[#a8893e] text-[#060D1A]'
                    : card.alert
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-white/5 text-[#4F8CFF]'
                  }`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {(stats?.lowStockProducts?.length || products.filter(p => p.stockQuantity <= 5).length) > 0 && (
          <div>
            <div className="glass rounded-xl p-5 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Low Stock Alert</h3>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                  {(stats?.lowStockProducts || products.filter(p => p.stockQuantity <= 5)).length} items
                </Badge>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {(stats?.lowStockProducts || products.filter(p => p.stockQuantity <= 5)).slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-3.5 w-3.5 text-white/20" />
                        )}
                      </div>
                      <span className="text-sm text-white/80 truncate max-w-[200px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.stockQuantity === 0
                        ? <Badge className="bg-red-500/15 text-red-400 border-0 text-xs">Out of Stock</Badge>
                        : <Badge className="bg-amber-500/15 text-amber-400 border-0 text-xs">{p.stockQuantity} left</Badge>
                      }
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-[#4F8CFF] hover:text-[#7AB3FF] hover:bg-[#4F8CFF]/10" onClick={() => openEditProduct(p)}>
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
              <Button variant="ghost" size="sm" className="text-xs text-[#4F8CFF] hover:text-[#7AB3FF] hover:bg-[#4F8CFF]/10" onClick={() => handleTabChange('orders')}>
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Order</th>
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Customer</th>
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Date</th>
                    <th className="text-right text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Total</th>
                    <th className="text-center text-xs text-white/40 font-medium py-2 px-3 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentOrders || orders.slice(0, 6)).map((order) => (
                    <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-sm font-medium text-white/80">#{order.orderNumber.slice(-6)}</td>
                      <td className="py-3 px-3 text-sm text-white/60">{order.customer?.name || 'Customer'}</td>
                      <td className="py-3 px-3 text-sm text-white/50">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-3 text-sm font-medium text-white/80 text-right tabular-nums">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className={`text-xs border-0 ${STATUS_COLORS[order.status] || ''}`}>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Products Tab ───────────────────────────────────────────────────────
  const renderProducts = () => {
    if (loading) return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 shimmer rounded-lg" />
          <Skeleton className="h-10 w-40 shimmer rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg shimmer" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 shimmer rounded" />
                <Skeleton className="h-3 w-32 shimmer rounded" />
              </div>
              <Skeleton className="h-8 w-20 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    )

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white/[0.04] border-white/8 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/40 rounded-lg"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10 bg-white/[0.04] border-white/8 text-sm text-white/70 rounded-lg">
                <Filter className="h-4 w-4 mr-2 text-white/30" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B1628] border-white/10">
                <SelectItem value="all" className="text-white/80 focus:bg-white/5 focus:text-white">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/5 focus:text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border border-white/8 overflow-hidden">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setProductStatusFilter(s)}
                  className={`px-3 py-2 text-xs font-medium transition-all duration-200 ${productStatusFilter === s
                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF]'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={openAddProduct}
            className="w-full sm:w-auto h-10 bg-gradient-to-r from-[#4F8CFF] to-[#a8893e] text-[#060D1A] font-semibold text-sm hover:from-[#d4b76e] hover:to-[#b8974a] rounded-lg shadow-lg shadow-[#4F8CFF]/20 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Product Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Product</th>
                  <th className="text-left text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Category</th>
                  <th className="text-right text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Price</th>
                  <th className="text-center text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Stock</th>
                  <th className="text-center text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Status</th>
                  <th className="text-right text-xs text-white/40 font-medium py-3 px-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-white/30 text-sm">
                      {searchQuery || categoryFilter !== 'all' || productStatusFilter !== 'all' ? 'No products match your filters' : 'No products yet. Click “Add Product” to get started!'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, i) => (
                    <tr
                      key={product.id}
                      className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group ${!product.isActive ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="h-4 w-4 text-white/20" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white/90 truncate max-w-[220px]">{product.name}</p>
                            {product.isFeatured && (
                              <Badge className="bg-[#4F8CFF]/15 text-[#4F8CFF] border-0 text-[10px] px-1.5 py-0 mt-0.5">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10 text-xs">{product.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-white/90 tabular-nums">{formatCurrency(product.price)}</span>
                          {product.discountPrice && product.discountPrice < product.price && (
                            <span className="text-xs text-red-400/70 line-through tabular-nums">{formatCurrency(product.discountPrice)}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{stockIndicator(product.stockQuantity)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleProductActive(product)}
                          className="cursor-pointer"
                          title={product.isActive ? 'Click to deactivate' : 'Click to reactivate'}
                        >
                          <Badge variant="outline" className={`text-xs border-0 cursor-pointer ${product.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-amber-500/10 hover:text-amber-400'}`}>
                            <Power className={`h-2.5 w-2.5 mr-1 ${product.isActive ? 'text-emerald-400' : 'text-white/30'}`} />
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-[#4F8CFF] hover:bg-[#4F8CFF]/10" onClick={() => openEditProduct(product)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10" onClick={() => { setDeletingProduct(product); setDeleteDialogOpen(true) }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredProducts.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-white/40">Showing {filteredProducts.length} of {products.length} products</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Orders Tab ─────────────────────────────────────────────────────────
  const renderOrders = () => {
    if (loading) return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shimmer rounded-full" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32 shimmer rounded" />
              <Skeleton className="h-6 w-20 shimmer rounded-full" />
            </div>
            <Skeleton className="h-4 w-48 shimmer rounded" />
            <Skeleton className="h-4 w-64 shimmer rounded" />
          </div>
        ))}
      </div>
    )

    const statuses = ['all', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

    return (
      <div className="space-y-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setOrderStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border
                ${orderStatusFilter === s
                  ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/30'
                  : 'bg-white/[0.03] text-white/50 border-white/8 hover:bg-white/[0.06] hover:text-white/70'
                }`}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className={`ml-1.5 text-[10px] ${orderStatusFilter === s ? 'text-[#4F8CFF]/70' : 'text-white/30'}`}>
                {statusCounts[s] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Order Cards */}
        {filteredOrders.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const nextStatus = STATUS_FLOW[order.status]
            return (
              <div
                transition={{ delay: i * 0.06 }}
                className="glass rounded-xl p-5 card-hover"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">Order #{order.orderNumber.slice(-6)}</h4>
                      <Badge variant="outline" className={`text-xs border-0 ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-white/40">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center">
                    <User className="h-3 w-3 text-white/40" />
                  </div>
                  <span className="text-xs text-white/60">{order.customer?.name || 'Customer'}</span>
                  <span className="text-xs text-white/30">· {order.shippingAddress}</span>
                </div>

                {/* Items */}
                <div className="bg-white/[0.02] rounded-lg p-3 mb-3 max-h-32 overflow-y-auto">
                  {order.items.map((item, j) => (
                    <div key={item.id} className={`flex items-center justify-between py-1.5 ${j > 0 ? 'border-t border-white/5' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-white/5 flex items-center justify-center overflow-hidden">
                          {item.product?.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-3 w-3 text-white/20" />
                          )}
                        </div>
                        <span className="text-xs text-white/70 truncate max-w-[200px]">{item.productName}</span>
                        <span className="text-xs text-white/30">x{item.quantity}</span>
                      </div>
                      <span className="text-xs font-medium text-white/80 tabular-nums">{formatCurrency(item.productPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {nextStatus && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, nextStatus)}
                      className={`h-8 text-xs font-medium rounded-lg transition-all duration-300 ${
                        nextStatus === 'CONFIRMED'
                          ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : nextStatus === 'SHIPPED'
                            ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20'
                            : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/20'
                      }`}
                    >
                      {nextStatus === 'CONFIRMED' && <Check className="h-3.5 w-3.5 mr-1.5" />}
                      {nextStatus === 'SHIPPED' && <Truck className="h-3.5 w-3.5 mr-1.5" />}
                      {nextStatus === 'DELIVERED' && <Check className="h-3.5 w-3.5 mr-1.5" />}
                      Mark as {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
                    </Button>
                    {order.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="h-8 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
                {order.status === 'DELIVERED' && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Order Complete
                  </Badge>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  // ─── Payments Tab ──────────────────────────────────────────────────────
  const renderPayments = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Total Earnings (80%)</p>
          <p className="text-2xl font-bold text-[#4F8CFF]">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-white/30 mt-1">From {payments.length} transactions</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">This Month</p>
          <p className="text-2xl font-bold text-white">
            ${payments.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0).toFixed(2)}
          </p>
          <p className="text-xs text-white/30 mt-1">Monthly earnings</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-xs text-white/40 mb-1">Avg per Order</p>
          <p className="text-2xl font-bold text-white">
            ${payments.length > 0 ? (totalEarnings / payments.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-white/30 mt-1">Average earning</p>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/30">
            <DollarSign className="w-8 h-8 mb-3" />
            <p className="text-sm">No payments received yet</p>
            <p className="text-xs mt-1">Payments appear when orders are placed</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#4F8CFF]/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#4F8CFF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Order {p.order?.orderNumber}</p>
                    <p className="text-xs text-white/40">From {p.order?.customer?.name || 'Customer'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#4F8CFF]">+${p.amount.toFixed(2)}</p>
                  <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ─── Analytics Tab ──────────────────────────────────────────────────────
  const renderAnalytics = () => {
    if (loading) return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <Skeleton className="h-4 w-28 shimmer rounded" />
              <Skeleton className="h-8 w-36 shimmer rounded" />
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-5 space-y-4">
          <Skeleton className="h-5 w-40 shimmer rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 shimmer rounded" />
                <Skeleton className="h-3 w-16 shimmer rounded" />
              </div>
              <Skeleton className="h-3 w-full shimmer rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )

    const maxCatRevenue = Math.max(...Object.values(analytics.categoryRevenue), 1)
    const maxStatusCount = Math.max(...Object.values(analytics.statusBreakdown), 1)

    const statusColorMap: Record<string, string> = {
      PENDING: 'bg-amber-400',
      CONFIRMED: 'bg-blue-400',
      SHIPPED: 'bg-purple-400',
      DELIVERED: 'bg-emerald-400',
      CANCELLED: 'bg-red-400',
    }

    return (
      <div className="space-y-6">
        {/* Revenue Overview */}
        <div className="glass rounded-xl p-6 glow-blue">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-[#4F8CFF]" />
            <h3 className="text-sm font-semibold text-white">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-gradient-blue tabular-nums mb-1">
            <AnimatedCounter target={analytics.totalRevenue} prefix="$" decimals={2} />
          </p>
          <p className="text-xs text-white/40">From non-cancelled orders</p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Avg Order Value', value: analytics.avgOrderValue, prefix: '$', decimals: 2, icon: <TrendingUp className="h-4 w-4" /> },
            { label: 'Total Orders', value: orders.length, decimals: 0, icon: <ShoppingCart className="h-4 w-4" /> },
            { label: 'Delivered', value: analytics.deliveredCount, decimals: 0, icon: <Check className="h-4 w-4" /> },
          ].map((m, i) => (
            <div key={m.label}>
              <div className="glass rounded-xl p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{m.label}</p>
                  <span className="text-[#4F8CFF]/60">{m.icon}</span>
                </div>
                <p className="text-xl font-bold text-white tabular-nums">
                  <AnimatedCounter target={m.value as number} prefix={(m as any).prefix || ''} decimals={(m as any).decimals || 0} />
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Category Distribution */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#4F8CFF]" />
            Revenue by Category
          </h3>
          {Object.keys(analytics.categoryRevenue).length === 0 ? (
            <p className="text-sm text-white/30 py-4 text-center">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.categoryRevenue)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, rev], i) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">{cat}</span>
                      <span className="text-xs font-medium text-white/80 tabular-nums">{formatCurrency(rev)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(rev / maxCatRevenue) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-[#4F8CFF] to-[#7AB3FF]"
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[#4F8CFF]" />
            Order Status Breakdown
          </h3>
          {Object.keys(analytics.statusBreakdown).length === 0 ? (
            <p className="text-sm text-white/30 py-4 text-center">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.statusBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count], i) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 w-24 truncate">{status}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxStatusCount) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${statusColorMap[status] || 'bg-white/30'}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-white/70 w-8 text-right tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Main Layout ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#060D1A] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-white/5 ${
          sidebarOpen ? 'w-[260px]' : 'w-[72px]'
        } bg-[#060D1A] relative z-20`}
      >
        {renderSidebar()}
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-[#0B1628] border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-[#4F8CFF]/30 transition-all z-30"
        >
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="h-3 w-3" />
          </motion.div>
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#060D1A] border-r border-white/5 z-50 lg:hidden"
            >
              {renderSidebar()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileSidebar(true)}
                className="lg:hidden h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              {/* Store name badge */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#4F8CFF] to-[#a8893e] flex items-center justify-center">
                  <Store className="h-3.5 w-3.5 text-[#060D1A]" />
                </div>
                <span className="text-sm font-medium text-white/80 hidden sm:inline">{user?.name || 'My Store'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button className="relative h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/8 transition-all">
                <Bell className="h-4 w-4" />
                {(stats?.lowStockCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {Math.min((stats?.lowStockCount ?? 0), 9)}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 px-2 rounded-lg bg-white/5 hover:bg-white/8 transition-all">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#a8893e] flex items-center justify-center">
                      <User className="h-3 w-3 text-[#060D1A]" />
                    </div>
                    <span className="text-xs font-medium text-white/70 hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="h-3 w-3 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-white/10" style={{ background: 'rgba(11, 22, 40, 0.98)', backdropFilter: 'blur(20px)' }}>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white/90">{user?.name}</p>
                    <p className="text-xs text-white/40">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="text-white/70 focus:bg-white/5 focus:text-white cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { logout(); setCurrentPanel(null) }}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    {activeTab === 'dashboard' && 'Overview of your store performance'}
                    {activeTab === 'products' && 'Manage your product catalog'}
                    {activeTab === 'orders' && 'Track and manage customer orders'}
                    {activeTab === 'payments' && 'Your earnings and payment history'}
                    {activeTab === 'analytics' && 'Detailed performance insights'}
                  </p>
                </div>

                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'products' && renderProducts()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'payments' && renderPayments()}
                {activeTab === 'analytics' && renderAnalytics()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ─── Product Add/Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="bg-[#0B1628] border-white/10 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-white/40">
              {editingProduct ? 'Update product details below.' : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Wireless Headphones"
                className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Description</Label>
              <Textarea
                value={productForm.description}
                onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
                className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg resize-none"
              />
            </div>

            {/* Price Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Discount Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.discountPrice}
                  onChange={e => setProductForm(f => ({ ...f, discountPrice: e.target.value }))}
                  placeholder="0.00"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg tabular-nums"
                />
              </div>
            </div>

            {/* Category Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Category *</Label>
                <Select value={productForm.category} onValueChange={v => setProductForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-sm text-white/70 rounded-lg">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1628] border-white/10">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/5 focus:text-white">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Subcategory</Label>
                <Input
                  value={productForm.subcategory}
                  onChange={e => setProductForm(f => ({ ...f, subcategory: e.target.value }))}
                  placeholder="e.g. Over-ear"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Tags <span className="text-white/30">(comma-separated)</span></Label>
              <Input
                value={productForm.tags}
                onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. wireless, bluetooth, noise-canceling"
                className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg"
              />
            </div>

            {/* Target Age Range */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Target Age Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  value={productForm.targetAgeMin}
                  onChange={e => setProductForm(f => ({ ...f, targetAgeMin: e.target.value }))}
                  placeholder="Min age"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg tabular-nums"
                />
                <Input
                  type="number"
                  value={productForm.targetAgeMax}
                  onChange={e => setProductForm(f => ({ ...f, targetAgeMax: e.target.value }))}
                  placeholder="Max age"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg tabular-nums"
                />
              </div>
            </div>

            {/* Target Professions */}
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60">Target Professions <span className="text-white/30">(comma-separated)</span></Label>
              <Input
                value={productForm.targetProfessions}
                onChange={e => setProductForm(f => ({ ...f, targetProfessions: e.target.value }))}
                placeholder="e.g. engineer, designer, student"
                className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg"
              />
            </div>

            {/* Stock & Image */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Stock Quantity</Label>
                <Input
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={e => setProductForm(f => ({ ...f, stockQuantity: e.target.value }))}
                  placeholder="0"
                  className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 focus:border-[#4F8CFF]/40 rounded-lg tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">Product Image</Label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center h-10 rounded-lg bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 text-[#4F8CFF] text-xs font-medium cursor-pointer hover:bg-[#4F8CFF]/20 transition-colors">
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const formData = new FormData()
                        formData.append('file', file)
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formData })
                          const data = await res.json()
                          if (data.url) setProductForm(f => ({ ...f, imageUrl: data.url }))
                        } catch { /* silent */ }
                      }}
                    />
                  </label>
                </div>
                {productForm.imageUrl && (
                  <div className="relative w-full h-16 rounded-lg overflow-hidden border border-white/10 mt-1">
                    <img src={productForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProductForm(f => ({ ...f, imageUrl: '' }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-xs text-white/60">Featured Product</Label>
                <p className="text-[10px] text-white/30 mt-0.5">Featured products are highlighted in the store</p>
              </div>
              <button
                type="button"
                onClick={() => setProductForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${productForm.isFeatured ? 'bg-[#4F8CFF]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${productForm.isFeatured ? 'left-6 bg-black' : 'left-1 bg-white/50'}`} />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setProductDialogOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/5 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={saving || !productForm.name || !productForm.price || !productForm.category}
              className="bg-gradient-to-r from-[#4F8CFF] to-[#a8893e] text-[#060D1A] font-semibold text-sm hover:from-[#d4b76e] hover:to-[#b8974a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0B1628] border-white/10 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to delete <span className="text-white font-medium">{deletingProduct?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-lg"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
