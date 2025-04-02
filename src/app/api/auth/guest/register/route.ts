import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json()

    // Check if guest already exists
    const existingGuest = await prisma.guest.findUnique({
      where: { email }
    })

    if (existingGuest) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new guest
    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone
      }
    })

    return NextResponse.json({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
} 