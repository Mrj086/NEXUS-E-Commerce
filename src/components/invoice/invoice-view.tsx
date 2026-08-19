'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Printer, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InvoiceItem {
  id: string
  productName: string
  productPrice: number
  quantity: number
  product?: { id: string; name: string; imageUrl?: string | null; category?: string } | null
}

interface InvoiceOrder {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  shippingAddress: string
  paymentMethod?: string | null
  notes?: string | null
  sellerEarnings: number
  adminEarnings: number
  createdAt: string
  customer: { id: string; name: string; email: string; phone?: string | null; address?: string | null }
  seller?: { id: string; name: string; email?: string | null; phone?: string | null; address?: string | null } | null
  items: InvoiceItem[]
  payments: Array<{ id: string; amount: number; type: string; status: string }>
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
}

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function InvoiceView({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [order, setOrder] = useState<InvoiceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="text-white text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="text-red-400 text-lg">Order not found</div>
      </div>
    )
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
      {/* Screen-only controls */}
      <div className="print:hidden absolute top-4 right-4 flex gap-2 z-10">
        <Button
          onClick={handlePrint}
          className="gap-2 bg-white text-black hover:bg-gray-200"
        >
          <Printer className="w-4 h-4" /> Print
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Invoice content */}
      <div
        ref={printRef}
        className="bg-white text-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:rounded-none print:max-h-none print:overflow-visible"
      >
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 print:mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-black">NEXUS</h1>
              <p className="text-sm text-gray-500 print:text-gray-600">AI-Powered E-Commerce Platform</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">INVOICE</div>
              <div className="text-sm text-gray-500 mt-1">#{order.orderNumber}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 mb-6 print:mb-4" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 print:mb-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
              <p className="font-semibold text-gray-900">{order.customer.name}</p>
              <p className="text-sm text-gray-600">{order.customer.email}</p>
              {order.customer.phone && <p className="text-sm text-gray-600">{order.customer.phone}</p>}
              {order.customer.address && <p className="text-sm text-gray-600">{order.customer.address}</p>}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className="text-gray-900">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-semibold" style={{ color: STATUS_COLORS[order.status] || '#6B7280' }}>
                    {order.status}
                  </span>
                </div>
                {order.seller && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seller:</span>
                    <span className="text-gray-900">{order.seller.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6 print:mb-4">
            <thead>
              <tr className="border-b-2 border-gray-200 print:border-black">
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">#</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">Item</th>
                <th className="text-center py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">Unit Price</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider print:text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-100 print:border-gray-300">
                  <td className="py-3 text-sm text-gray-500 print:text-gray-600">{i + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover print:border print:border-gray-300"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center print:border print:border-gray-300">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 print:text-black">{item.productName}</p>
                        {item.product?.category && (
                          <p className="text-xs text-gray-400 print:text-gray-500">{item.product.category}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-center text-gray-700 print:text-gray-800">{item.quantity}</td>
                  <td className="py-3 text-sm text-right text-gray-700 print:text-gray-800">{formatPrice(item.productPrice)}</td>
                  <td className="py-3 text-sm text-right font-medium text-gray-900 print:text-black">
                    {formatPrice(item.productPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8 print:mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500 print:text-gray-600">Subtotal</span>
                <span className="text-gray-900 print:text-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500 print:text-gray-600">Tax</span>
                <span className="text-gray-900 print:text-black">$0.00</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-500 print:text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium print:text-green-700">FREE</span>
              </div>
              <div className="border-t-2 border-gray-900 mt-2 pt-2 print:border-black">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900 print:text-black">Total</span>
                  <span className="text-lg font-bold text-blue-600 print:text-blue-700">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 print:mb-4 print:bg-gray-100 print:border print:border-gray-300">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 print:text-gray-600">Ship To</h3>
            <p className="text-sm text-gray-700 print:text-gray-800">{order.shippingAddress || order.customer.address || 'Not specified'}</p>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-6 print:mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 print:text-gray-600">Notes</h3>
              <p className="text-sm text-gray-600 print:text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 print:pt-3 print:border-gray-300">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400 print:text-gray-500">Thank you for shopping with NEXUS!</p>
              <p className="text-xs text-gray-400 print:text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
