

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify seller exists
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller || seller.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    // Get products data
    const [productCount, lowStockProducts] = await Promise.all([
      db.product.count({ where: { sellerId } }),
      db.product.findMany({
        where: { sellerId, isActive: true, stockQuantity: { lte: 5 } },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
      }),
    ])

    // Get orders for this seller (orders containing this seller's products)
    const orders = await db.order.findMany({
      where: {
        items: { some: { product: { sellerId } } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true, sellerId: true } },
          },
        },
      },
    })

    // Calculate seller-specific revenue from order items
    let totalRevenue = 0
    for (const order of orders) {
      for (const item of order.items) {
        if (item.product?.sellerId === sellerId) {
          totalRevenue += item.productPrice * item.quantity
        }
      }
    }

    return NextResponse.json({
      stats: {
        productCount,
        orderCount: orders.length,
        totalRevenue,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: orders.slice(0, 5),
      },
    })
  } catch (error) {
    console.error('Seller stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
