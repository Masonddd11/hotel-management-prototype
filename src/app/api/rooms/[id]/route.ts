import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/rooms/[id] - Get a specific room
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
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
    console.error(`Error fetching room ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}

// PUT /api/rooms/[id] - Update a room
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json()
    
    const updateData: Prisma.RoomUpdateInput = {
      number: data.number,
      type: data.type,
      basePrice: data.basePrice,
      vipDiscount: parseFloat(data.vipDiscount) || 0  ,
      size: data.size,
      capacity: data.capacity,
      amenities: data.amenities,
      status: data.status,
    }
    
    const room = await prisma.room.update({
      where: {
        id: params.id,
      },
      data: updateData
    })
    
    return NextResponse.json(room)
  } catch (error) {
    console.error(`Error updating room ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

// DELETE /api/rooms/[id] - Delete a room
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
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
        id: params.id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting room ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
} 