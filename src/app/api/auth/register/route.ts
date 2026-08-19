

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const VALID_ROLES = ['CUSTOMER', 'SELLER', 'ADMIN'] as const

type Role = (typeof VALID_ROLES)[number]

interface RegisterBody {
  email: string
  password: string
  name: string
  role: string
  age?: number
  profession?: string
  phone?: string
  address?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json()

    const { email, password, name, role, age, profession, phone, address } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        age: age ?? null,
        profession: profession ?? null,
        phone: phone ?? null,
        address: address ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        age: true,
        profession: true,
        phone: true,
        address: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
