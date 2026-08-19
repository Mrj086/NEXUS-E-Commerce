

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const sellerId = searchParams.get('sellerId')

    // When sellerId is provided, return ALL products for that seller (including inactive)
    // This is used by the seller panel to manage their inventory
    const where: Record<string, unknown> = sellerId
      ? { sellerId }
      : { isActive: true }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CreateProductBody {
  name: string
  description: string
  price: number
  discountPrice?: number
  category: string
  subcategory?: string
  tags?: string
  targetAgeMin?: number
  targetAgeMax?: number
  targetProfessions?: string
  stockQuantity: number
  imageUrl?: string
  isFeatured?: boolean
  sellerId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductBody = await request.json()

    const {
      name,
      description,
      price,
      discountPrice,
      category,
      subcategory,
      tags,
      targetAgeMin,
      targetAgeMax,
      targetProfessions,
      stockQuantity,
      imageUrl,
      isFeatured,
      sellerId,
    } = body

    if (!name || !price || !category || !sellerId) {
      return NextResponse.json(
        { error: 'name, price, category, and sellerId are required' },
        { status: 400 }
      )
    }

    // Verify the seller exists and is a SELLER
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (!seller || seller.role !== 'SELLER') {
      return NextResponse.json(
        { error: 'Invalid seller' },
        { status: 403 }
      )
    }

    const product = await db.product.create({
      data: {
        name,
        description: description || '',
        price,
        discountPrice: discountPrice ?? null,
        category,
        subcategory: subcategory ?? null,
        tags: tags ?? '',
        targetAgeMin: targetAgeMin ?? null,
        targetAgeMax: targetAgeMax ?? null,
        targetProfessions: targetProfessions ?? null,
        stockQuantity: stockQuantity ?? 0,
        imageUrl: imageUrl ?? null,
        isFeatured: isFeatured ?? false,
        sellerId,
      },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
