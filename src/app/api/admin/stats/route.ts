import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      customers,
      sellers,
      admins,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      sellerList,
      totalRevenue,
      adminPayments,
    ] = await Promise.all([
      db.user.count(),
      db.product.count(),
      db.order.count(),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.count({ where: { role: 'SELLER' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'DELIVERED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.user.findMany({
        where: { role: 'SELLER' },
        select: {
          id: true, name: true, email: true, isActive: true, createdAt: true,
          products: { select: { id: true } },
          sellerOrders: { select: { id: true, totalAmount: true, status: true } },
        },
      }),
      db.order.aggregate({ _sum: { totalAmount: true } }),
      db.payment.aggregate({
        where: { type: 'ADMIN_COMMISSION' },
        _sum: { amount: true },
      }),
    ])

    const sellerStats = await Promise.all(
      sellerList.map(async (seller) => {
        const sellerRevenue = await db.order.aggregate({
          where: { sellerId: seller.id, status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
          _sum: { totalAmount: true },
        })
        const sellerPayments = await db.payment.aggregate({
          where: { recipientId: seller.id, type: 'SELLER_EARNING' },
          _sum: { amount: true },
        })
        return {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          isActive: seller.isActive,
          createdAt: seller.createdAt,
          productCount: seller.products.length,
          orderCount: seller.sellerOrders.length,
          totalRevenue: sellerRevenue._sum.totalAmount || 0,
          totalEarnings: sellerPayments._sum.amount || 0,
        }
      })
    )

    const topProducts = await db.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, productPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })

    const customerProfessions = await db.user.groupBy({
      by: ['profession'],
      where: { role: 'CUSTOMER', profession: { not: null } },
      _count: { profession: true },
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        adminCommission: adminPayments._sum.amount || 0,
        orderBreakdown: {
          customers,
          sellers,
          admins,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },
      sellerStats,
      topProducts,
      customerProfessions,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
