import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/facilities - Get all facilities
export async function GET() {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        operatingHours: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(facilities)
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}

// POST /api/facilities - Create a new facility
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Find the hotel (or create a default one if needed)
    let hotel = await prisma.hotel.findFirst()
    
    if (!hotel) {
      hotel = await prisma.hotel.create({
        data: {
          name: 'Default Hotel',
          address: '123 Main Street',
          description: 'Default hotel created automatically',
        },
      })
    }
    
    const facility = await prisma.facility.create({
      data: {
        name: data.name,
        type: data.type,
        basePrice: data.basePrice,
        capacity: data.capacity,
        description: data.description || '',
        status: data.status,
        hotelId: hotel.id,
        operatingHours: {
          create: data.operatingHours || [],
        },
      },
      include: {
        operatingHours: true,
      },
    })
    
    return NextResponse.json(facility, { status: 201 })
  } catch (error) {
    console.error('Error creating facility:', error)
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    )
  }
} 