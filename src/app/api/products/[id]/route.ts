

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const product = await db.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
        reviews: {
          include: {
            customer: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Increment browsing history if customerId is provided
    if (customerId) {
      await db.browsingHistory.upsert({
        where: {
          customerId_productId: {
            customerId,
            productId: id,
          },
        },
        create: {
          customerId,
          productId: id,
          viewCount: 1,
          lastViewedAt: new Date(),
        },
        update: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

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
      isActive,
    } = body

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(discountPrice !== undefined && { discountPrice: discountPrice ?? null }),
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory: subcategory ?? null }),
        ...(tags !== undefined && { tags }),
        ...(targetAgeMin !== undefined && { targetAgeMin: targetAgeMin ?? null }),
        ...(targetAgeMax !== undefined && { targetAgeMax: targetAgeMax ?? null }),
        ...(targetProfessions !== undefined && { targetProfessions: targetProfessions ?? null }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ?? null }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Soft-delete: set isActive to false
    // (hard delete is blocked by FK constraints from OrderItem/Review)
    const product = await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
