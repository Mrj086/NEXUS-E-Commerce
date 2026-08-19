

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

interface LoginBody {
  email: string
  password: string
  role?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()

    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      const roleLabel = role === 'ADMIN' ? 'admin' : role === 'SELLER' ? 'seller' : 'customer'
      return NextResponse.json(
        { error: `No ${roleLabel} account found with this email` },
        { status: 401 }
      )
    }

    // Validate role match if role is specified
    if (role && user.role !== role.toUpperCase()) {
      const roleLabel = role === 'ADMIN' ? 'an admin' : role === 'SELLER' ? 'a seller' : 'a customer'
      return NextResponse.json(
        { error: `This email is registered as ${user.role.toLowerCase()}, not ${roleLabel}. Please select the correct role.` },
        { status: 403 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
