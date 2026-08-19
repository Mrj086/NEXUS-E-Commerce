import { create } from 'zustand'

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'SELLER' | null

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  age?: number
  profession?: string
  avatar?: string
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productPrice: number
  productImage?: string
  quantity: number
}

interface AppState {
  // Hydration flag
  _hydrated: boolean

  // Auth state
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void

  // UI state
  currentPanel: 'login' | 'register' | 'admin' | 'customer' | 'seller' | null
  setCurrentPanel: (panel: AppState['currentPanel']) => void

  // Cart state
  cartItems: CartItem[]
  cartCount: number
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // Chat state
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Hydration
  _hydrated: false,

  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, currentPanel: null }),

  // UI
  currentPanel: null,
  setCurrentPanel: (panel) => set({ currentPanel: panel }),

  // Cart
  cartItems: [],
  cartCount: 0,
  addToCart: (item) => {
    const items = get().cartItems
    const existing = items.find(i => i.productId === item.productId)
    if (existing) {
      set({
        cartItems: items.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
        cartCount: get().cartCount + item.quantity,
      })
    } else {
      set({
        cartItems: [...items, item],
        cartCount: get().cartCount + item.quantity,
      })
    }
  },
  removeFromCart: (productId) => {
    const items = get().cartItems
    const item = items.find(i => i.productId === productId)
    set({
      cartItems: items.filter(i => i.productId !== productId),
      cartCount: get().cartCount - (item?.quantity || 0),
    })
  },
  updateCartQuantity: (productId, quantity) => {
    const items = get().cartItems
    const oldItem = items.find(i => i.productId === productId)
    set({
      cartItems: items.map(i =>
        i.productId === productId ? { ...i, quantity } : i
      ),
      cartCount: get().cartCount - (oldItem?.quantity || 0) + quantity,
    })
  },
  clearCart: () => set({ cartItems: [], cartCount: 0 }),

  // Chat
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
}))
