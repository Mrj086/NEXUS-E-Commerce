'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'
import { Label } from '@/components/ui/label'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Search,
  TrendingUp,
  DollarSign,
  Bell,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  UserCheck,
  UserX,
  ImageOff,
  BarChart3,
  CircleDot,
  Shield,
  ArrowUpRight,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Camera,
  Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  age: number | null
  profession: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdminProduct {
  id: string
  name: string
  description: string
  price: number
  discountPrice: number | null
  category: string
  stockQuantity: number
  imageUrl: string | null
  isFeatured: boolean
  isActive: boolean
  rating: number
  reviewCount: number
  seller: { id: string; name: string } | null
  createdAt: string
}

interface AdminOrderItem {
  id: string
  productName: string
  productPrice: number
  quantity: number
  product: { id: string; name: string; imageUrl: string | null } | null
}

interface AdminOrder {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  shippingAddress: string
  paymentMethod: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: { id: string; name: string; email: string; avatar: string | null } | null
  items: AdminOrderItem[]
}

interface UserBreakdown {
  totalUsers: number
  customers: number
  sellers: number
  admins: number
}

interface OrderBreakdown {
  totalOrders: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SHIPPED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-400',
  CONFIRMED: 'bg-blue-400',
  SHIPPED: 'bg-purple-400',
  DELIVERED: 'bg-emerald-400',
  CANCELLED: 'bg-red-400',
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
}

const sidebarItemVariants = {
  hover: { x: 4, transition: { duration: 0.2 } },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Skeleton Components ────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-full shimmer" />
        <Skeleton className="h-4 w-16 shimmer" />
      </div>
      <Skeleton className="h-8 w-24 mb-2 shimmer" />
      <Skeleton className="h-4 w-32 shimmer" />
    </div>
  )
}

function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02]">
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i} className="py-3">
          <Skeleton className="h-4 w-full max-w-[120px] shimmer" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <Skeleton className="h-5 w-36 shimmer" />
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i} className="text-muted-foreground text-xs uppercase tracking-wider">
                <Skeleton className="h-3 w-16 shimmer" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Mini Bar Chart ──────────────────────────────────────────────────────────

function MiniBarChart({ data, label }: { data: { label: string; value: number; color: string }[]; label: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{label}</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.1 + 0.3, duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-6 rounded bg-white/[0.04] overflow-hidden relative">
              <motion.div
                className={`h-full rounded ${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxVal) * 100}%` }}
                transition={{ delay: i * 0.1 + 0.5, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
            <span className="text-xs font-medium text-white w-8 text-right shrink-0">
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
// ─── Sidebar ─────────────────────────────────────────────────────────────────

type TabValue = 'dashboard' | 'users' | 'products' | 'orders' | 'payments'

interface SidebarProps {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
  isOpen: boolean
  onClose: () => void
  userName: string
}

function Sidebar({ activeTab, onTabChange, isOpen, onClose, userName }: SidebarProps) {
  const { logout } = useAppStore()

  const navItems: { icon: React.ReactNode; label: string; value: TabValue }[] = [
    { icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: 'Dashboard', value: 'dashboard' },
    { icon: <Users className="h-4.5 w-4.5" />, label: 'Users', value: 'users' },
    { icon: <Package className="h-4.5 w-4.5" />, label: 'Products', value: 'products' },
    { icon: <ShoppingCart className="h-4.5 w-4.5" />, label: 'Orders', value: 'orders' },
    { icon: <DollarSign className="h-4.5 w-4.5" />, label: 'Payments', value: 'payments' },
  ]

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px]
          bg-[#060D1A]/80 backdrop-blur-2xl border-r border-white/[0.06]
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4F8CFF] to-[#2563EB] flex items-center justify-center">
              <span className="text-black font-bold text-sm">N</span>
            </div>
            <span className="text-gradient-blue text-xl font-bold tracking-wider">NEXUS</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.value
              return (
                <motion.button
                  key={item.value}
                  variants={sidebarItemVariants}
                  whileHover="hover"
                  onClick={() => {
                    onTabChange(item.value)
                    onClose()
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 cursor-pointer relative
                    ${
                      isActive
                        ? 'text-[#4F8CFF] bg-[#4F8CFF]/10 border-l-2 border-[#4F8CFF]'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border-l-2 border-transparent'
                    }
                  `}
                >
                  <span className={isActive ? 'text-[#4F8CFF]' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              )
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/[0.06] p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                <Avatar className="h-9 w-9 border border-[#4F8CFF]/30">
                  <AvatarFallback className="bg-[#4F8CFF]/15 text-[#4F8CFF] text-xs font-semibold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/20 font-semibold tracking-wider"
                  >
                    ADMIN
                  </Badge>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/30" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-48 border-white/10" style={{ background: 'rgba(11, 22, 40, 0.98)', backdropFilter: 'blur(20px)' }}
            >
              <DropdownMenuLabel className="text-white/60 text-xs">Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string
  onMenuClick: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onRefresh: () => void
  loading: boolean
}

function Header({ title, onMenuClick, searchQuery, onSearchChange, onRefresh, loading }: HeaderProps) {
  const { user, logout } = useAppStore()

  return (
    <header className="sticky top-0 z-30 h-16 glass-strong border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white/60 hover:text-white hover:bg-white/10 h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="
                h-9 pl-9 pr-4 bg-white/[0.04] border-white/10
                text-sm text-white placeholder:text-white/30
                focus:border-[#4F8CFF]/50 focus:ring-[#4F8CFF]/20
                rounded-lg
              "
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="text-white/50 hover:text-white hover:bg-white/10 h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white/50 hover:text-white hover:bg-white/10 h-9 w-9 relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#4F8CFF] rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer">
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarFallback className="bg-[#4F8CFF]/15 text-[#4F8CFF] text-[10px] font-semibold">
                    {user ? getInitials(user.name) : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-white/30 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-white/10" style={{ background: 'rgba(11, 22, 40, 0.98)', backdropFilter: 'blur(20px)' }}
            >
              <DropdownMenuLabel className="text-white/60 text-xs">
                {user?.name ?? 'Admin'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────

function DashboardTab({
  stats,
  userBreakdown,
  orderBreakdown,
  recentOrders,
  loading,
}: {
  stats: AdminStats | null
  userBreakdown: UserBreakdown | null
  orderBreakdown: OrderBreakdown | null
  recentOrders: AdminOrder[]
  loading: boolean
}) {
  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="h-5 w-5" />,
      change: '+12.5%',
      up: true,
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? 0,
      icon: <Package className="h-5 w-5" />,
      change: '+8.2%',
      up: true,
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: <ShoppingCart className="h-5 w-5" />,
      change: '+23.1%',
      up: true,
    },
    {
      label: 'Revenue',
      value: stats?.totalRevenue ?? 0,
      icon: <DollarSign className="h-5 w-5" />,
      change: '+18.7%',
      up: true,
      isCurrency: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading && !stats
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={statCardVariants}
                initial="hidden"
                animate="visible"
                className="
                  rounded-xl border border-white/5 bg-[#0B1628] p-5
                  card-hover group cursor-default
                "
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 flex items-center justify-center text-[#4F8CFF]">
                    {card.icon}
                  </div>
                  <div
                    className={`
                      flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full
                      ${card.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}
                    `}
                  >
                    {card.up ? <ArrowUpRight className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                    {card.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">
                  {card.isCurrency ? formatCurrency(card.value as number) : card.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </motion.div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {userBreakdown && (
          <MiniBarChart
            label="User Breakdown"
            data={[
              { label: 'Customers', value: userBreakdown.customers, color: 'bg-[#4F8CFF]' },
              { label: 'Sellers', value: userBreakdown.sellers, color: 'bg-[#7AB3FF]' },
              { label: 'Admins', value: userBreakdown.admins, color: 'bg-white/30' },
            ]}
          />
        )}
        {orderBreakdown && (
          <MiniBarChart
            label="Order Status Distribution"
            data={[
              { label: 'Pending', value: orderBreakdown.pending, color: 'bg-amber-400' },
              { label: 'Confirmed', value: orderBreakdown.confirmed, color: 'bg-blue-400' },
              { label: 'Shipped', value: orderBreakdown.shipped, color: 'bg-purple-400' },
              { label: 'Delivered', value: orderBreakdown.delivered, color: 'bg-emerald-400' },
              { label: 'Cancelled', value: orderBreakdown.cancelled, color: 'bg-red-400' },
            ]}
          />
        )}
        {!userBreakdown && !orderBreakdown && (
          <>
            <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
              <Skeleton className="h-5 w-32 mb-4 shimmer" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16 shimmer" />
                    <Skeleton className="h-6 flex-1 shimmer" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
              <Skeleton className="h-5 w-40 mb-4 shimmer" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16 shimmer" />
                    <Skeleton className="h-6 flex-1 shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Seller & Customer Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Seller Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111D33] rounded-lg p-3">
              <p className="text-xs text-white/40">Total Sellers</p>
              <p className="text-lg font-bold text-[#4F8CFF]">{userBreakdown?.sellers ?? 0}</p>
            </div>
            <div className="bg-[#111D33] rounded-lg p-3">
              <p className="text-xs text-white/40">Active Sellers</p>
              <p className="text-lg font-bold text-[#00D4AA]">--</p>
            </div>
            <div className="bg-[#111D33] rounded-lg p-3 col-span-2">
              <p className="text-xs text-white/40">Total Seller Revenue (80% split)</p>
              <p className="text-lg font-bold text-white">${(stats?.totalRevenue ? stats.totalRevenue * 0.8 : 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Customer Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111D33] rounded-lg p-3">
              <p className="text-xs text-white/40">Total Customers</p>
              <p className="text-lg font-bold text-[#4F8CFF]">{userBreakdown?.customers ?? 0}</p>
            </div>
            <div className="bg-[#111D33] rounded-lg p-3">
              <p className="text-xs text-white/40">Avg Order Value</p>
              <p className="text-lg font-bold text-[#00D4AA]">${stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}</p>
            </div>
            <div className="bg-[#111D33] rounded-lg p-3 col-span-2">
              <p className="text-xs text-white/40">Admin Commission (20% split)</p>
              <p className="text-lg font-bold text-white">${(stats?.totalRevenue ? stats.totalRevenue * 0.2 : 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
          <Badge variant="outline" className="text-xs border-white/10 text-white/40">
            {recentOrders.length} orders
          </Badge>
        </div>
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Order</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Items</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && recentOrders.length === 0
                ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                : recentOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <TableCell className="py-3">
                        <span className="text-sm font-mono text-[#4F8CFF]">{order.orderNumber.slice(0, 16)}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-white/80">
                          {order.customer?.name ?? 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <span className="text-sm text-white/60">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-white">{formatCurrency(order.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'border-white/10 text-white/60'}`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <span className="text-sm text-white/40">{formatDate(order.createdAt)}</span>
                      </TableCell>
                    </motion.tr>
                  ))}
              {!loading && recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab({
  users,
  loading,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onToggleActive,
}: {
  users: AdminUser[]
  loading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  roleFilter: string
  onRoleFilterChange: (r: string) => void
  onToggleActive: (userId: string, isActive: boolean) => void
}) {
  const rolePills = ['ALL', 'ADMIN', 'CUSTOMER', 'SELLER']

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              h-9 pl-9 pr-4 bg-white/[0.04] border-white/10
              text-sm text-white placeholder:text-white/30
              focus:border-[#4F8CFF]/50 focus:ring-[#4F8CFF]/20
              rounded-lg
            "
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {rolePills.map((role) => (
            <button
              key={role}
              onClick={() => onRoleFilterChange(role)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  roleFilter === role
                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/10 hover:text-white/70 hover:bg-white/[0.06]'
                }
              `}
            >
              {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">User</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Role</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredUsers.length === 0
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                : filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-white/5 hover:bg-[#4F8CFF]/[0.03] transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/10">
                            <AvatarFallback className="bg-[#111D33] text-white/60 text-xs font-medium">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <span className="text-sm text-white/50">{user.email}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium px-2 py-0.5 bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/20"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`}
                          />
                          <span className="text-xs text-white/50">{user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden lg:table-cell">
                        <span className="text-sm text-white/40">{formatDate(user.createdAt)}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => onToggleActive(user.id, checked)}
                          className="data-[state=checked]:bg-[#4F8CFF] data-[state=unchecked]:bg-white/10"
                        />
                      </TableCell>
                    </motion.tr>
                  ))}
              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── Edit Product Dialog ──────────────────────────────────────────────────

interface EditProductForm {
  name: string
  description: string
  price: string
  discountPrice: string
  category: string
  subcategory: string
  tags: string
  targetAgeMin: string
  targetAgeMax: string
  targetProfessions: string
  stockQuantity: string
  imageUrl: string
  isFeatured: boolean
  isActive: boolean
}

function EditProductDialog({
  product,
  open,
  onClose,
  onSave,
}: {
  product: AdminProduct | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>
}) {
  const [form, setForm] = useState<EditProductForm>({
    name: '', description: '', price: '', discountPrice: '', category: '',
    subcategory: '', tags: '', targetAgeMin: '', targetAgeMax: '',
    targetProfessions: '', stockQuantity: '', imageUrl: '', isFeatured: false, isActive: true,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product && open) {
      setForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        discountPrice: product.discountPrice ? String(product.discountPrice) : '',
        category: product.category,
        subcategory: '',
        tags: '',
        targetAgeMin: '',
        targetAgeMax: '',
        targetProfessions: '',
        stockQuantity: String(product.stockQuantity),
        imageUrl: product.imageUrl || '',
        isFeatured: product.isFeatured,
        isActive: product.isActive,
      })
      setImagePreview(product.imageUrl || null)
    }
  }, [product, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setForm(prev => ({ ...prev, imageUrl: data.url }))
        setImagePreview(data.url)
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!product) return
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        category: form.category,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        imageUrl: form.imageUrl || null,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      }
      if (form.discountPrice) updateData.discountPrice = parseFloat(form.discountPrice)
      await onSave(product.id, updateData)
      onClose()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof EditProductForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B1628] border-white/10 text-white" style={{ scrollbarWidth: 'thin' }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#4F8CFF]" />
            Edit Product
          </DialogTitle>
          <DialogDescription className="text-white/50">Update product details and image</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">Product Image</Label>
            <div className="flex items-start gap-4">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-dashed border-white/10 bg-[#0B1628] group cursor-pointer shrink-0"
                   onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Camera className="w-6 h-6 text-white/20" />
                    <span className="text-[10px] text-white/30">Upload</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-white/10 text-white/60 hover:bg-white/5 hover:text-white text-xs"
                >
                  {uploading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</> : <>Upload New Image</>}
                </Button>
                {form.imageUrl && (
                  <p className="text-[10px] text-white/30 truncate font-mono">{form.imageUrl}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Product Name *</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Category *</Label>
              <Input value={form.category} onChange={e => updateField('category', e.target.value)}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Price ($) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Discount Price ($)</Label>
              <Input type="number" step="0.01" value={form.discountPrice} onChange={e => updateField('discountPrice', e.target.value)}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Stock Quantity *</Label>
              <Input type="number" value={form.stockQuantity} onChange={e => updateField('stockQuantity', e.target.value)}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Image URL</Label>
              <Input value={form.imageUrl} onChange={e => { updateField('imageUrl', e.target.value); setImagePreview(e.target.value) }}
                className="h-9 bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50 font-mono text-xs" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-white/70 text-xs">Description</Label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-[#4F8CFF]/50 focus:ring-[#4F8CFF]/20 p-3 resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => updateField('isFeatured', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-[#4F8CFF]" />
              <span className="text-sm text-white/70">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => updateField('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-[#4F8CFF]" />
              <span className="text-sm text-white/70">Active</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/60 hover:bg-white/5">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.price}
            style={{ background: 'linear-gradient(135deg, #4F8CFF, #7AB3FF)' }}
            className="text-[#060D1A] font-medium hover:opacity-90">
            {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab({
  products,
  loading,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onEditProduct,
  onDeleteProduct,
  onToggleActive,
}: {
  products: AdminProduct[]
  loading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  categoryFilter: string
  onCategoryFilterChange: (c: string) => void
  onEditProduct: (product: AdminProduct) => void
  onDeleteProduct: (id: string) => void
  onToggleActive: (id: string, currentStatus: boolean) => void
}) {
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              h-9 pl-9 pr-4 bg-white/[0.04] border-white/10
              text-sm text-white placeholder:text-white/30
              focus:border-[#4F8CFF]/50 focus:ring-[#4F8CFF]/20
              rounded-lg
            "
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryFilterChange(cat)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${
                  categoryFilter === cat
                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/10 hover:text-white/70 hover:bg-white/[0.06]'
                }
              `}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Price</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Stock</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredProducts.length === 0
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                : filteredProducts.map((product, i) => (
                    <motion.tr
                      key={product.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-white/5 hover:bg-[#4F8CFF]/[0.03] transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#111D33] border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageOff className="h-4 w-4 text-white/20" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-white/40 truncate max-w-[200px]">{product.seller?.name ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium px-2 py-0.5 bg-white/[0.04] text-white/60 border-white/10"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {formatCurrency(product.discountPrice ?? product.price)}
                          </span>
                          {product.discountPrice && (
                            <span className="text-xs text-white/30 line-through">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <span
                          className={`text-sm ${
                            product.stockQuantity === 0
                              ? 'text-red-400'
                              : product.stockQuantity < 10
                                ? 'text-amber-400'
                                : 'text-white/60'
                          }`}
                        >
                          {product.stockQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`
                            text-[10px] font-medium px-2 py-0.5
                            ${
                              product.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }
                          `}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => onEditProduct(product)}
                            className="h-7 w-7 rounded-md flex items-center justify-center bg-[#4F8CFF]/10 text-[#4F8CFF] hover:bg-[#4F8CFF]/20 transition-colors"
                            title="Edit product">
                            <Pencil className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => onToggleActive(product.id, product.isActive)}
                            className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${product.isActive ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                            title={product.isActive ? 'Deactivate' : 'Activate'}>
                            {product.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => onDeleteProduct(product.id)}
                            className="h-7 w-7 rounded-md flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete product">
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
              {!loading && filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersTab({
  orders,
  loading,
  statusFilter,
  onStatusFilterChange,
}: {
  orders: AdminOrder[]
  loading: boolean
  statusFilter: string
  onStatusFilterChange: (s: string) => void
}) {
  const statusPills = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* Status Filter Pills */}
      <div className="flex gap-1.5 flex-wrap">
        {statusPills.map((status) => {
          const count =
            status === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status === status).length
          return (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5
                ${
                  statusFilter === status
                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/10 hover:text-white/70 hover:bg-white/[0.06]'
                }
              `}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              <span
                className={`
                  h-4 min-w-[16px] px-1 rounded-full text-[10px] flex items-center justify-center
                  ${statusFilter === status ? 'bg-[#4F8CFF]/20 text-[#4F8CFF]' : 'bg-white/[0.06] text-white/40'}
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Order #</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Items</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredOrders.length === 0
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                : filteredOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-white/5 hover:bg-[#4F8CFF]/[0.03] transition-colors"
                    >
                      <TableCell className="py-3">
                        <span className="text-sm font-mono text-[#4F8CFF]">
                          #{order.orderNumber.slice(0, 12)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-white/10">
                            <AvatarFallback className="bg-[#111D33] text-white/50 text-[10px] font-medium">
                              {order.customer ? getInitials(order.customer.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-white/80">
                              {order.customer?.name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-white/30 hidden sm:block">
                              {order.customer?.email ?? ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden sm:table-cell">
                        <span className="text-sm text-white/60">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'border-white/10 text-white/60'}`}
                        >
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[order.status] ?? 'bg-white/40'}`} />
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <span className="text-sm text-white/40">{formatDate(order.createdAt)}</span>
                      </TableCell>
                    </motion.tr>
                  ))}
              {!loading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── Payments Tab ────────────────────────────────────────────────────────────

interface AdminPayment {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  order: { orderNumber: string; totalAmount: number; status: string; customer: { name: string } } | null
}

function PaymentsTab({ payments, totalCommission, loading }: { payments: AdminPayment[]; totalCommission: number; loading: boolean }) {
  const thisMonth = payments.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
          <p className="text-xs text-white/40 mb-1">Total Commission (20%)</p>
          <p className="text-2xl font-bold text-[#4F8CFF]">${totalCommission.toFixed(2)}</p>
          <p className="text-xs text-white/30 mt-1">From {payments.length} transactions</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
          <p className="text-xs text-white/40 mb-1">This Month</p>
          <p className="text-2xl font-bold text-[#00D4AA]">${thisMonth.toFixed(2)}</p>
          <p className="text-xs text-white/30 mt-1">Monthly commission</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#0B1628] p-5">
          <p className="text-xs text-white/40 mb-1">Avg per Order</p>
          <p className="text-2xl font-bold text-white">
            ${payments.length > 0 ? (totalCommission / payments.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-white/30 mt-1">Average commission</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0B1628] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Commission History</h3>
        </div>
        {loading && payments.length === 0 ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40 shimmer" />
                <Skeleton className="h-4 w-20 shimmer" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/30">
            <DollarSign className="w-8 h-8 mb-3" />
            <p className="text-sm">No commissions received yet</p>
            <p className="text-xs mt-1">Commissions appear when orders are placed</p>
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
                    <p className="text-sm font-medium text-white">Order {p.order?.orderNumber || 'N/A'}</p>
                    <p className="text-xs text-white/40">From {p.order?.customer?.name || 'Customer'} - Commission</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#00D4AA]">+${p.amount.toFixed(2)}</p>
                  <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Admin Panel ────────────────────────────────────────────────────────

export function AdminPanel() {
  const { user, setCurrentPanel } = useAppStore()

  // UI state
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Tab-specific filters
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userBreakdown, setUserBreakdown] = useState<UserBreakdown | null>(null)
  const [orderBreakdown, setOrderBreakdown] = useState<OrderBreakdown | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [adminPayments, setAdminPayments] = useState<{ id: string; amount: number; type: string; status: string; createdAt: string; order: { orderNumber: string; totalAmount: number; status: string; customer: { name: string } } | null }[]>([])
  const [adminTotalCommission, setAdminTotalCommission] = useState(0)

  // Edit product dialog state
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    newStatus: boolean
  }>({ open: false, userId: '', userName: '', newStatus: true })

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?type=all')
      const data = await res.json()
      if (data.stats) setStats(data.stats)
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  }, [])

  const fetchUserBreakdown = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?type=users')
      const data = await res.json()
      if (data.stats) setUserBreakdown(data.stats)
    } catch (e) {
      console.error('Failed to fetch user breakdown:', e)
    }
  }, [])

  const fetchOrderBreakdown = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?type=orders')
      const data = await res.json()
      if (data.stats) setOrderBreakdown(data.stats)
    } catch (e) {
      console.error('Failed to fetch order breakdown:', e)
    }
  }, [])

  const fetchUsers = async (role?: string, search?: string) => {
    try {
      const params = new URLSearchParams()
      if (role && role !== 'ALL') params.set('role', role)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (e) {
      console.error('Failed to fetch users:', e)
    }
  }

  const fetchProducts = async (category?: string, search?: string) => {
    try {
      const params = new URLSearchParams()
      if (category && category !== 'ALL') params.set('category', category)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/products?${params.toString()}`)
      const data = await res.json()
      if (data.products) setProducts(data.products)
    } catch (e) {
      console.error('Failed to fetch products:', e)
    }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (e) {
      console.error('Failed to fetch orders:', e)
    }
  }, [])

  const fetchAdminPayments = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/payments?recipientId=${user.id}&type=ADMIN_COMMISSION`)
      const data = await res.json()
      setAdminPayments(data.payments || [])
      setAdminTotalCommission(data.totalEarnings || 0)
    } catch { /* silent */ }
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchStats(),
      fetchUserBreakdown(),
      fetchOrderBreakdown(),
      fetchUsers(),
      fetchProducts(),
      fetchOrders(),
      fetchAdminPayments(),
    ])
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const targetUser = users.find((u) => u.id === userId)
    if (!targetUser) return

    setConfirmDialog({
      open: true,
      userId,
      userName: targetUser.name,
      newStatus: isActive,
    })
  }

  const confirmToggleActive = async () => {
    const { userId, newStatus } = confirmDialog
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: newStatus }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u))
        )
      }
    } catch (e) {
      console.error('Failed to toggle user status:', e)
    }
    setConfirmDialog((prev) => ({ ...prev, open: false }))
  }

  const handleRefresh = () => {
    fetchAll()
  }

  const handleEditProduct = (product: AdminProduct) => {
    setEditProduct(product)
    setEditDialogOpen(true)
  }

  const handleSaveProduct = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Update failed' }))
      throw new Error(err.error || 'Update failed')
    }
    await fetchProducts(productCategoryFilter, productSearchQuery)
  }

  const handleToggleProductActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      await fetchProducts(productCategoryFilter, productSearchQuery)
    } catch (e) {
      console.error('Toggle active error:', e)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      await fetchProducts(productCategoryFilter, productSearchQuery)
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const handleUserRoleFilterChange = (role: string) => {
    setUserRoleFilter(role)
    fetchUsers(role, userSearchQuery)
  }

  const handleUserSearchChange = (q: string) => {
    setUserSearchQuery(q)
    fetchUsers(userRoleFilter, q)
  }

  const handleProductCategoryFilterChange = (category: string) => {
    setProductCategoryFilter(category)
    fetchProducts(category, productSearchQuery)
  }

  const handleProductSearchChange = (q: string) => {
    setProductSearchQuery(q)
    fetchProducts(productCategoryFilter, q)
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    if (activeTab === 'users') handleUserSearchChange(q)
    else if (activeTab === 'products') handleProductSearchChange(q)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabValue)
    setSearchQuery('')
    setUserSearchQuery('')
    setProductSearchQuery('')
    // Re-fetch data for the target tab
    if (loading) return
    if (tab === 'dashboard') { fetchStats(); fetchUserBreakdown(); fetchOrderBreakdown() }
    else if (tab === 'users') fetchUsers()
    else if (tab === 'products') fetchProducts()
    else if (tab === 'orders') fetchOrders()
    else if (tab === 'payments') fetchAdminPayments()
  }

  // ─── Page titles ────────────────────────────────────────────────────────

  const pageTitles: Record<TabValue, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    products: 'Product Catalog',
    orders: 'Order Management',
    payments: 'Commission Payments',
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user?.name ?? 'Admin'}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageTitles[activeTab]}
          onMenuClick={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          loading={loading}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  stats={stats}
                  userBreakdown={userBreakdown}
                  orderBreakdown={orderBreakdown}
                  recentOrders={orders.slice(0, 10)}
                  loading={loading}
                />
              )}
              {activeTab === 'users' && (
                <UsersTab
                  users={users}
                  loading={loading}
                  searchQuery={userSearchQuery}
                  onSearchChange={handleUserSearchChange}
                  roleFilter={userRoleFilter}
                  onRoleFilterChange={handleUserRoleFilterChange}
                  onToggleActive={handleToggleActive}
                />
              )}
              {activeTab === 'products' && (
                <ProductsTab
                  products={products}
                  loading={loading}
                  searchQuery={productSearchQuery}
                  onSearchChange={handleProductSearchChange}
                  categoryFilter={productCategoryFilter}
                  onCategoryFilterChange={handleProductCategoryFilterChange}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleActive={handleToggleProductActive}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  loading={loading}
                  statusFilter={orderStatusFilter}
                  onStatusFilterChange={setOrderStatusFilter}
                />
              )}
              {activeTab === 'payments' && (
                <PaymentsTab payments={adminPayments} totalCommission={adminTotalCommission} loading={loading} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editProduct}
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditProduct(null) }}
        onSave={handleSaveProduct}
      />

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-[#0B1628] border-white/10 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {confirmDialog.newStatus ? 'Activate User' : 'Deactivate User'}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Are you sure you want to {confirmDialog.newStatus ? 'activate' : 'deactivate'}{' '}
              <span className="text-white font-medium">{confirmDialog.userName}</span>? This will{' '}
              {confirmDialog.newStatus ? 'restore' : 'revoke'} their access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleActive}
              className={`
                ${confirmDialog.newStatus
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              `}
            >
              {confirmDialog.newStatus ? 'Activate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
