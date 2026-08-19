

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // If no type, return all stats
    if (!type || type === 'all') {
      const [totalUsers, totalProducts, totalOrders, orders] = await Promise.all([
        db.user.count(),
        db.product.count({ where: { isActive: true } }),
        db.order.count(),
        db.order.findMany({ where: { status: { not: 'CANCELLED' } } }),
      ])

      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

      return NextResponse.json({
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
        },
      })
    }

    // Individual stat types
    switch (type) {
      case 'users': {
        const totalUsers = await db.user.count()
        const customers = await db.user.count({ where: { role: 'CUSTOMER' } })
        const sellers = await db.user.count({ where: { role: 'SELLER' } })
        const admins = await db.user.count({ where: { role: 'ADMIN' } })
        return NextResponse.json({
          stats: { totalUsers, customers, sellers, admins },
        })
      }

      case 'products': {
        const totalProducts = await db.product.count({ where: { isActive: true } })
        const featuredProducts = await db.product.count({ where: { isFeatured: true, isActive: true } })
        const outOfStock = await db.product.count({ where: { stockQuantity: 0, isActive: true } })
        return NextResponse.json({
          stats: { totalProducts, featuredProducts, outOfStock },
        })
      }

      case 'orders': {
        const totalOrders = await db.order.count()
        const pending = await db.order.count({ where: { status: 'PENDING' } })
        const confirmed = await db.order.count({ where: { status: 'CONFIRMED' } })
        const shipped = await db.order.count({ where: { status: 'SHIPPED' } })
        const delivered = await db.order.count({ where: { status: 'DELIVERED' } })
        const cancelled = await db.order.count({ where: { status: 'CANCELLED' } })
        return NextResponse.json({
          stats: { totalOrders, pending, confirmed, shipped, delivered, cancelled },
        })
      }

      case 'revenue': {
        const orders = await db.order.findMany({
          where: { status: { not: 'CANCELLED' } },
        })
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
        const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')
        const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
        return NextResponse.json({
          stats: { totalRevenue, deliveredRevenue, avgOrderValue, orderCount: orders.length },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown stat type: ${type}. Valid types: all, users, products, orders, revenue` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
