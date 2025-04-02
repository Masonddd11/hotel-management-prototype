import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DayOfWeek } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/facilities/[id] - Get a specific facility
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const facility = await prisma.facility.findUnique({
      where: {
        id: params.id,
      },
      include: {
        operatingHours: true,
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
    console.error(`Error fetching facility ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    )
  }
}

// PUT /api/facilities/[id] - Update a facility
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json()
    
    // First, update the facility
    const facility = await prisma.facility.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        type: data.type,
        basePrice: data.basePrice,
        vipDiscount: data.vipDiscount,
        capacity: data.capacity,
        description: data.description || '',
        status: data.status,
      },
      include: {
        operatingHours: true,
      },
    })
    
    // If operatingHours are provided, update them
    if (data.operatingHours && Array.isArray(data.operatingHours)) {
      // Delete all existing hours
      await prisma.operatingHours.deleteMany({
        where: {
          facilityId: params.id,
        },
      })
      
      // Create new hours
      const hours = await Promise.all(
        data.operatingHours.map((hour: { dayOfWeek: DayOfWeek; openTime: string; closeTime: string }) =>
          prisma.operatingHours.create({
            data: {
              facilityId: params.id,
              dayOfWeek: hour.dayOfWeek,
              openTime: hour.openTime,
              closeTime: hour.closeTime,
            },
          })
        )
      )
      
      // Return the updated facility with new hours
      return NextResponse.json({
        ...facility,
        operatingHours: hours,
      })
    }
    
    return NextResponse.json(facility)
  } catch (error) {
    console.error(`Error updating facility ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    )
  }
}

// DELETE /api/facilities/[id] - Delete a facility
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Check if facility exists
    const facility = await prisma.facility.findUnique({
      where: {
        id: params.id,
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
      booking => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(booking.status)
    )
    
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete facility with active bookings' },
        { status: 400 }
      )
    }
    
    // Delete operating hours
    await prisma.operatingHours.deleteMany({
      where: {
        facilityId: params.id,
      },
    })
    
    // Delete the facility
    await prisma.facility.delete({
      where: {
        id: params.id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting facility ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    )
  }
} 