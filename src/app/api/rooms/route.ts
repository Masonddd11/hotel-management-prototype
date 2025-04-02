import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rooms - Get all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: {
        number: 'asc',
      },
    })
    
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

// POST /api/rooms - Create a new room
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
    
    const room = await prisma.room.create({
      data: {
        number: data.number,
        type: data.type,
        basePrice: data.basePrice,
        vipDiscount: parseFloat(data.vipDiscount),
        size: data.size,
        capacity: data.capacity,
        amenities: data.amenities,
        status: data.status,
        hotelId: hotel.id,
      },
    })
    
    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
} 