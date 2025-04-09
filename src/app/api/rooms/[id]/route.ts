import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET /api/rooms/[id] - Get a specific room
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const room = await prisma.room.findUnique({
      where: {
        id,
      },
      include: {
        bookings: true,
      },
    })
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}

// PUT /api/rooms/[id] - Update a room
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const data = await request.json()
    
    const room = await prisma.room.update({
      where: {
        id,
      },
      data: {
        number: data.number,
        type: data.type,
        basePrice: data.basePrice,
        vipDiscount: data.vipDiscount,
        size: data.size,
        capacity: data.capacity,
        amenities: data.amenities,
        status: data.status,
      },
    })
    
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

// DELETE /api/rooms/[id] - Delete a room
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: {
        id,
      },
      include: {
        bookings: true,
      },
    })
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    // Check if room has active bookings
    const activeBookings = room.bookings.filter(
      booking => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status)
    )
    
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room with active bookings' },
        { status: 400 }
      )
    }
    
    // Delete the room
    await prisma.room.delete({
      where: {
        id,
      },
    })
    
    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
} 