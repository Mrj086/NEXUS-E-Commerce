

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter is required' },
        { status: 400 }
      )
    }

    const cart = await db.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart) {
      return NextResponse.json({ cart: null, items: [] })
    }

    return NextResponse.json({ cart, items: cart.items })
  } catch (error) {
    console.error('Get cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface AddToCartBody {
  customerId: string
  productId: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const body: AddToCartBody = await request.json()
    const { customerId, productId, quantity } = body

    if (!customerId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'customerId, productId, and quantity are required' },
        { status: 400 }
      )
    }

    // Check product exists and is active
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      )
    }

    // Check stock
    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    const cart = await db.cart.upsert({
      where: { customerId },
      create: { customerId },
      update: {},
    })

    // Upsert cart item
    const cartItem = await db.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
      include: {
        product: true,
      },
    })

    return NextResponse.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error('Add to cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cartItemId')

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'cartItemId query parameter is required' },
        { status: 400 }
      )
    }

    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } })
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    await db.cartItem.delete({ where: { id: cartItemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove from cart error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
