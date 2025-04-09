import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET /api/facilities/[id] - Get a specific facility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const facility = await prisma.facility.findUnique({
      where: {
        id,
      },
      include: {
        bookings: true,
      },
    })
    
    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(facility)
  } catch (error) {
    console.error('Error fetching facility:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    )
  }
}

// PUT /api/facilities/[id] - Update a facility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const facility = await prisma.facility.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        operatingHours: data.operatingHours,
        status: data.status,
      },
    })
    
    return NextResponse.json(facility)
  } catch (error) {
    console.error('Error updating facility:', error)
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    )
  }
}

// DELETE /api/facilities/[id] - Delete a facility
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if facility exists
    const facility = await prisma.facility.findUnique({
      where: {
        id,
      },
      include: {
        bookings: true,
      },
    })
    
    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      )
    }
    
    // Check if facility has active bookings
    const activeBookings = facility.bookings.filter(
      booking => ['PENDING', 'CONFIRMED'].includes(booking.status)
    )
    
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete facility with active bookings' },
        { status: 400 }
      )
    }
    
    // Delete the facility
    await prisma.facility.delete({
      where: {
        id,
      },
    })
    
    return NextResponse.json({ message: 'Facility deleted successfully' })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    )
  }
} 