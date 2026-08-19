import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const type = searchParams.get('type')

    if (!recipientId) {
      return NextResponse.json({ error: 'recipientId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { recipientId }
    if (type) where.type = type

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            status: true,
            customer: { select: { name: true } },
          },
        },
      },
    })

    // Calculate totals
    const totalEarnings = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)

    return NextResponse.json({ payments, totalEarnings })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
