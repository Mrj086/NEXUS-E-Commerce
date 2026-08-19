

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const sellerId = searchParams.get('sellerId')
    const status = searchParams.get('status')

    if (!customerId && !sellerId) {
      return NextResponse.json(
        { error: 'customerId or sellerId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (sellerId) {
      where.items = {
        some: {
          product: { sellerId },
        },
      }
    }

    if (status) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sellerId: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CartItemInput {
  productId: string
  productName: string
  productPrice: number
  quantity: number
}

interface CreateOrderBody {
  customerId: string
  shippingAddress: string
  paymentMethod: string
  notes?: string
  items?: CartItemInput[]
  cardNumber?: string
  mobileBankProvider?: string
  mobileBankPhone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderBody = await request.json()
    const { customerId, shippingAddress, paymentMethod, notes, items: clientItems, cardNumber, mobileBankProvider, mobileBankPhone } = body

    if (!customerId || !shippingAddress) {
      return NextResponse.json(
        { error: 'customerId and shippingAddress are required' },
        { status: 400 }
      )
    }

    // Build payment detail string
    let paymentDetail = paymentMethod
    if (paymentMethod === 'CARD' && cardNumber) {
      paymentDetail = `Card ending ${cardNumber}`
    } else if (paymentMethod === 'MOBILE_BANKING' && mobileBankProvider) {
      paymentDetail = `${mobileBankProvider.charAt(0).toUpperCase() + mobileBankProvider.slice(1)} - ${mobileBankPhone || 'N/A'}`
    }

    // Try to use client-sent cart items first, fall back to DB cart
    let orderSourceItems: CartItemInput[] = []
    let dbCart: { id: string } | null = null

    if (clientItems && clientItems.length > 0) {
      // Validate products exist and are active
      const productIds = clientItems.map(i => i.productId)
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
      })
      const productMap = new Map(products.map(p => [p.id, p]))

      for (const item of clientItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          return NextResponse.json(
            { error: `Product "${item.productName}" not found` },
            { status: 400 }
          )
        }
        if (!product.isActive) {
          return NextResponse.json(
            { error: `Product "${item.productName}" is no longer available` },
            { status: 400 }
          )
        }
        if (product.stockQuantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for "${item.productName}"` },
            { status: 400 }
          )
        }
        // Use server-side price (discount if available)
        orderSourceItems.push({
          productId: item.productId,
          productName: product.name,
          productPrice: product.discountPrice ?? product.price,
          quantity: item.quantity,
        })
      }
    } else {
      // Fall back to DB cart
      const cart = await db.cart.findUnique({
        where: { customerId },
        include: { items: { include: { product: true } } },
      })

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty. Add items to your cart before placing an order.' },
          { status: 400 }
        )
      }

      dbCart = cart

      // Validate stock for all items
      for (const item of cart.items) {
        if (!item.product.isActive) {
          return NextResponse.json(
            { error: `Product "${item.product.name}" is no longer available` },
            { status: 400 }
          )
        }
        if (item.product.stockQuantity < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for "${item.product.name}"` },
            { status: 400 }
          )
        }
      }

      // Build items from DB cart
      orderSourceItems = cart.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.discountPrice ?? item.product.price,
        quantity: item.quantity,
      }))
    }

    // Calculate total
    let totalAmount = 0
    const orderItemsData = orderSourceItems.map((item) => {
      const itemTotal = item.productPrice * item.quantity
      totalAmount += itemTotal
      return {
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
      }
    })

    // Calculate payment splits: 80% seller, 20% admin
    const sellerEarnings = Math.round(totalAmount * 0.8 * 100) / 100
    const adminEarnings = Math.round(totalAmount * 0.2 * 100) / 100

    // Determine the primary seller from items
    const productIds = orderSourceItems.map(i => i.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sellerId: true },
    })
    // Use the seller of the first product as the order seller
    const primarySellerId = products.length > 0 ? products[0].sellerId : null

    // Find admin user for commission
    const adminUser = await db.user.findFirst({ where: { role: 'ADMIN', isActive: true }, select: { id: true } })

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          sellerId: primarySellerId,
          totalAmount,
          sellerEarnings,
          adminEarnings,
          status: 'PENDING',
          shippingAddress,
          paymentMethod: paymentDetail ?? null,
          notes: notes ?? null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          customer: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      // Create payment records
      if (primarySellerId) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            recipientId: primarySellerId,
            amount: sellerEarnings,
            type: 'SELLER_EARNING',
            status: 'COMPLETED',
          },
        })
      }
      if (adminUser) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            recipientId: adminUser.id,
            amount: adminEarnings,
            type: 'ADMIN_COMMISSION',
            status: 'COMPLETED',
          },
        })
      }

      // Deduct stock for each product
      for (const item of orderSourceItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      // Clear the DB cart if it was used
      if (dbCart) {
        await tx.cartItem.deleteMany({ where: { cartId: dbCart.id } })
      }

      return newOrder
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
